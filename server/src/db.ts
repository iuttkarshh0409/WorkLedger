import pg from 'pg';
import dotenv from 'dotenv';
import { getEnv } from './env.js';

dotenv.config();

const { Pool } = pg;

let activePool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (activePool) return activePool;

  const dbUrl = getEnv('DATABASE_URL');
  const hyperdrive = getEnv('HYPERDRIVE');

  console.log('[Database] DB_URL found:', !!dbUrl);
  console.log('[Database] Hyperdrive object found:', !!hyperdrive);
  if (hyperdrive) {
    console.log('[Database] Hyperdrive connectionString found:', !!hyperdrive.connectionString);
  }

  let connectionString = dbUrl;

  if (hyperdrive && hyperdrive.connectionString) {
    connectionString = hyperdrive.connectionString;
    console.log('[Database] Using Cloudflare Hyperdrive connection pool');
  } else {
    console.log('[Database] Using standard connection pool');
  }

  const isCloudflareEnv = typeof (globalThis as any).WebSocketPair !== 'undefined' || !!(globalThis as any).MIN_ENV;
  activePool = new Pool({
    connectionString,
    max: isCloudflareEnv ? 2 : 20,
    idleTimeoutMillis: isCloudflareEnv ? 1000 : 30000,
    connectionTimeoutMillis: 15000,
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
  return pool.query<T>(text, params);
}

/**
 * Utility to execute a set of queries in a single database transaction.
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
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
