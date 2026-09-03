// High-performance client-side cache for EduForge data requests
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes default TTL

export const apiCache = {
  get<T>(key: string, maxAgeMs = DEFAULT_TTL_MS): T | null {
    // 1. Check in-memory cache
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp <= maxAgeMs) {
        return entry.data;
      }
      memoryCache.delete(key);
    }

    // 2. Check sessionStorage fallback for instant reload persistence
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(`edu_cache_${key}`);
        if (stored) {
          const parsed: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() - parsed.timestamp <= maxAgeMs) {
            memoryCache.set(key, parsed);
            return parsed.data;
          }
          sessionStorage.removeItem(`edu_cache_${key}`);
        }
      }
    } catch {}

    return null;
  },

  set<T>(key: string, data: T): void {
    if (data === null || data === undefined) return;
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(`edu_cache_${key}`, JSON.stringify(entry));
      }
    } catch {}
  },

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      memoryCache.clear();
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith('edu_cache_')) sessionStorage.removeItem(k);
          });
        }
      } catch {}
      return;
    }

    for (const key of memoryCache.keys()) {
      if (key.includes(keyPattern)) {
        memoryCache.delete(key);
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem(`edu_cache_${key}`);
          }
        } catch {}
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
