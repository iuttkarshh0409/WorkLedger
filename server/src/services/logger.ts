import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditLog } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');
const STORAGE_FILE = path.join(STORAGE_DIR, 'logs.json');

export async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    try {
      await fs.access(STORAGE_FILE);
    } catch {
      await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to initialize logs storage:', error);
  }
}

export async function readLogs(): Promise<AuditLog[]> {
  await ensureStorage();
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
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}
