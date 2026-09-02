// High-performance client-side cache for EduForge data requests
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds TTL

export const apiCache = {
  get<T>(key: string, maxAgeMs = DEFAULT_TTL_MS): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data;
  },

  set<T>(key: string, data: T): void {
    if (data === null || data === undefined) return;
    memoryCache.set(key, { data, timestamp: Date.now() });
  },

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.includes(keyPattern)) {
        memoryCache.delete(key);
      }
    }
  },

  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS
  ): Promise<T> {
    const cached = this.get<T>(key, ttlMs);
    if (cached) {
      // Background revalidation to keep cache fresh without blocking UI
      fetchFn().then(fresh => {
        if (fresh) this.set(key, fresh);
      }).catch(() => {});
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data);
    return data;
  }
};
