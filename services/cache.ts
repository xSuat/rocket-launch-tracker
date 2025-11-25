interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      return null;
    }

    return entry.data;
  }

  getIgnoreTTL<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  getWithMeta<T>(key: string): { data: T | null; isStale: boolean; timestamp?: number } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { data: null, isStale: false };
    }

    const isStale = Date.now() - entry.timestamp > this.ttl;
    return { data: entry.data, isStale, timestamp: entry.timestamp };
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Singleton instance with 10 minute default TTL
export const memoryCache = new MemoryCache(10 * 60 * 1000);
