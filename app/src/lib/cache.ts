import { redis } from './redis';

const DEFAULT_CACHE_TIME = 60 * 5; // 5 minutes

export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async set<T>(
    key: string,
    value: T,
    expirySeconds: number = DEFAULT_CACHE_TIME
  ): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', expirySeconds);
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Cached function wrapper
  static cached = <T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    keyPrefix: string,
    expirySeconds: number = DEFAULT_CACHE_TIME
  ) => {
    return async (...args: Args): Promise<T> => {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      const cached = await Cache.get<T>(key);

      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      await Cache.set(key, result, expirySeconds);
      return result;
    };
  };
}
