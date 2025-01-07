import { Redis, RedisOptions } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'redis_password',
  retryStrategy: (times: number) => {
    // Exponential backoff with max 2 seconds
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis =
  globalForRedis.redis ??
  new Redis(redisOptions);

redis.on('error', (error: Error) => {
  console.error('Redis Client Error:', error);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
