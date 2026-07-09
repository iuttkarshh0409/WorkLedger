export class TtlCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  constructor(private defaultTtlMs: number = 30000) {} // Default 30s TTL

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs !== undefined ? ttlMs : this.defaultTtlMs);
    this.cache.set(key, { value, expiry });
  }

  invalidate(keyPattern: string | RegExp): void {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern);
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      for (const key of this.cache.keys()) {
        if (keyPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const ttlCache = new TtlCache();
