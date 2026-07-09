import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { requestContextStorage } from './middleware/context.js';

dotenv.config();

const { Pool } = pg;

let activePool: pg.Pool | null = null;
let env: any = process.env;

try {
  const cfModule = 'cloudflare:workers';
  const cf = await import(cfModule);
  if (cf && cf.env) {
    env = { ...process.env, ...cf.env };
  }
} catch (e) {
  // Ignored in local Node.js environment
}

export function getPool(): pg.Pool {
  if (activePool) return activePool;

  let connectionString = env.DATABASE_URL;

  if (env.HYPERDRIVE && env.HYPERDRIVE.connectionString) {
    connectionString = env.HYPERDRIVE.connectionString;
    console.log('[Database] Using Cloudflare Hyperdrive connection pool');
  } else {
    console.log('[Database] Using standard connection pool');
  }

  activePool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  activePool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle database client:', err);
  });

  return activePool;
}

export const pool = new Proxy({} as any, {
  get(target, prop, receiver) {
    const p = getPool();
    const val = Reflect.get(p, prop);
    if (typeof val === 'function') {
      return val.bind(p);
    }
    return val;
  }
}) as pg.Pool;

/**
 * Utility to run a query on the pool.
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  if (process.env.PERFORMANCE_LOGGING !== 'true') {
    return pool.query<T>(text, params);
  }

  const store = requestContextStorage.getStore();
  const requestId = store?.requestId || 'system';
  const sessionId = store?.sessionId || 'system';
  const queryName = store?.currentOperation || 'SQL Query';
  const spanId = randomUUID();
  const parentId = store ? store.spanStack[store.spanStack.length - 1] : null;

  const t0 = performance.now();
  let client;
  try {
    client = await pool.connect();
    const t1 = performance.now();
    const acquireDurationMs = t1 - t0;

    const t2 = performance.now();
    const res = await client.query<T>(text, params);
    const executeDurationMs = performance.now() - t2;
    const totalDurationMs = performance.now() - t0;

    let queryStatus = 'Healthy';
    if (totalDurationMs > 100) {
      queryStatus = 'Investigate';
    } else if (totalDurationMs > 50) {
      queryStatus = 'Slow';
    } else if (totalDurationMs > 20) {
      queryStatus = 'Monitor';
    }

    const event = {
      id: randomUUID(),
      requestId,
      sessionId,
      spanId,
      parentId,
      timestamp: new Date().toISOString(),
      category: 'Performance',
      stage: 'Database',
      operation: queryName,
      durationMs: totalDurationMs,
      metadata: {
        rows: res.rowCount || 0,
        queryStatus,
        acquireDurationMs,
        executeDurationMs,
        sql: text,
      },
    };

    if (store) {
      store.bufferedEvents.push(event);
    }

    return res;
  } catch (error) {
    const totalDurationMs = performance.now() - t0;
    const event = {
      id: randomUUID(),
      requestId,
      sessionId,
      spanId,
      parentId,
      timestamp: new Date().toISOString(),
      category: 'Performance',
      stage: 'Database',
      operation: queryName,
      durationMs: totalDurationMs,
      metadata: {
        error: String(error),
        queryStatus: 'Investigate',
        sql: text,
      },
    };

    if (store) {
      store.bufferedEvents.push(event);
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Utility to execute a set of queries in a single database transaction.
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  if (process.env.PERFORMANCE_LOGGING !== 'true') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const client = await pool.connect();

  const wrappedClient = new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return async function (text: any, params?: any[]) {
          const store = requestContextStorage.getStore();
          const requestId = store?.requestId || 'system';
          const sessionId = store?.sessionId || 'system';
          const queryName = store?.currentOperation || 'SQL Query';
          const spanId = randomUUID();
          const parentId = store ? store.spanStack[store.spanStack.length - 1] : null;

          const start = performance.now();
          try {
            const res = await client.query(text, params);
            const durationMs = performance.now() - start;

            let queryStatus = 'Healthy';
            if (durationMs > 100) {
              queryStatus = 'Investigate';
            } else if (durationMs > 50) {
              queryStatus = 'Slow';
            } else if (durationMs > 20) {
              queryStatus = 'Monitor';
            }

            const event = {
              id: randomUUID(),
              requestId,
              sessionId,
              spanId,
              parentId,
              timestamp: new Date().toISOString(),
              category: 'Performance',
              stage: 'Database',
              operation: queryName,
              durationMs,
              metadata: {
                rows: res.rowCount || 0,
                queryStatus,
                acquireDurationMs: 0,
                executeDurationMs: durationMs,
                sql: text,
              },
            };

            if (store) {
              store.bufferedEvents.push(event);
            }

            return res;
          } catch (error) {
            const durationMs = performance.now() - start;
            const event = {
              id: randomUUID(),
              requestId,
              sessionId,
              spanId,
              parentId,
              timestamp: new Date().toISOString(),
              category: 'Performance',
              stage: 'Database',
              operation: queryName,
              durationMs,
              metadata: {
                error: String(error),
                queryStatus: 'Investigate',
                sql: text,
              },
            };

            if (store) {
              store.bufferedEvents.push(event);
            }
            throw error;
          }
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  try {
    await wrappedClient.query('BEGIN');
    const result = await callback(wrappedClient);
    await wrappedClient.query('COMMIT');
    return result;
  } catch (error) {
    await wrappedClient.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
