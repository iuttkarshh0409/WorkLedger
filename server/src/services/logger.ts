import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditLog } from '../types/index.js';

const isCloudflare = typeof (globalThis as any).WebSocketPair !== 'undefined' || !!(globalThis as any).MIN_ENV;

let STORAGE_DIR = '';
let STORAGE_FILE = '';
let PERF_STORAGE_FILE = '';
let PERF_STORAGE_FILE_1 = '';
let PERF_STORAGE_FILE_2 = '';

if (!isCloudflare) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');
  STORAGE_FILE = path.join(STORAGE_DIR, 'logs.json');
  PERF_STORAGE_FILE = path.join(STORAGE_DIR, 'performance.json');
  PERF_STORAGE_FILE_1 = path.join(STORAGE_DIR, 'performance.1.json');
  PERF_STORAGE_FILE_2 = path.join(STORAGE_DIR, 'performance.2.json');
}

export async function ensureStorage(): Promise<void> {
  if (isCloudflare) return;
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    // Ensure logs.json exists
    try {
      await fs.access(STORAGE_FILE);
    } catch {
      await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Ensure performance.json exists
    try {
      await fs.access(PERF_STORAGE_FILE);
    } catch {
      await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to initialize logs storage:', error);
  }
}

export async function readLogs(): Promise<AuditLog[]> {
  await ensureStorage();
  if (isCloudflare) return [];
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    if (!data.trim()) return [];
    return JSON.parse(data) as AuditLog[];
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

export async function writeLog(log: AuditLog): Promise<void> {
  await ensureStorage();
  if (isCloudflare) {
    console.log('[Audit Log]', JSON.stringify(log));
    return;
  }
  try {
    const logs = await readLogs();
    logs.push(log);
    await fs.writeFile(STORAGE_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing log:', error);
  }
}

export async function clearLogs(): Promise<void> {
  await ensureStorage();
  if (isCloudflare) return;
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}

export async function readPerfLogs(): Promise<any[]> {
  await ensureStorage();
  if (isCloudflare) return [];
  try {
    const data = await fs.readFile(PERF_STORAGE_FILE, 'utf-8');
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading performance logs:', error);
    return [];
  }
}

export async function writePerfLog(log: any): Promise<void> {
  if (process.env.PERFORMANCE_LOGGING !== 'true') {
    return;
  }

  await ensureStorage();
  if (isCloudflare) {
    console.log('[Performance Log]', JSON.stringify(log));
    return;
  }
  try {
    const logs = await readPerfLogs();
    
    // Check if we need to rotate before adding the new log
    if (logs.length >= 5000) {
      try {
        try {
          await fs.rename(PERF_STORAGE_FILE_1, PERF_STORAGE_FILE_2);
        } catch {}
        await fs.rename(PERF_STORAGE_FILE, PERF_STORAGE_FILE_1);
      } catch (err) {
        console.error('Error rotating performance log files:', err);
      }
      
      await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify([log], null, 2), 'utf-8');
    } else {
      logs.push(log);
      await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error writing performance log:', error);
  }
}

export async function writePerfLogsBatch(batch: any[]): Promise<void> {
  if (process.env.PERFORMANCE_LOGGING !== 'true' || batch.length === 0) {
    return;
  }

  await ensureStorage();
  if (isCloudflare) {
    for (const log of batch) {
      console.log('[Performance Log]', JSON.stringify(log));
    }
    return;
  }
  try {
    const logs = await readPerfLogs();
    
    // Check if we need to rotate
    if (logs.length + batch.length >= 5000) {
      try {
        try {
          await fs.rename(PERF_STORAGE_FILE_1, PERF_STORAGE_FILE_2);
        } catch {}
        await fs.rename(PERF_STORAGE_FILE, PERF_STORAGE_FILE_1);
      } catch (err) {
        console.error('Error rotating performance log files:', err);
      }
      
      await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify(batch, null, 2), 'utf-8');
    } else {
      logs.push(...batch);
      await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error writing performance log batch:', error);
  }
}

export async function clearPerfLogs(): Promise<void> {
  await ensureStorage();
  if (isCloudflare) return;
  try {
    await fs.writeFile(PERF_STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    try {
      await fs.unlink(PERF_STORAGE_FILE_1);
    } catch {}
    try {
      await fs.unlink(PERF_STORAGE_FILE_2);
    } catch {}
  } catch (error) {
    console.error('Error clearing performance logs:', error);
  }
}
