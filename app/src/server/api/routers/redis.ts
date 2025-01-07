import { redis } from '@/lib/redis';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const redisRouter = createTRPCRouter({
  status: publicProcedure.query(async () => {
    try {
      const info = await redis.info();
      return { connected: true, info };
    } catch (error) {
      return { connected: false, error: String(error) };
    }
  }),

  get: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => {
    const value = await redis.get(input.key);
    const ttl = await redis.ttl(input.key);
    return {
      value,
      ttl,
      exists: value !== null,
    };
  }),

  test: publicProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        ttl: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const { key, value, ttl } = input;

      // Test set with TTL
      await redis.set(key, value, 'EX', ttl);

      // Test get
      const stored = await redis.get(key);

      // Test TTL
      const remaining = await redis.ttl(key);

      return {
        stored,
        ttl: remaining,
        matches: stored === value,
      };
    }),
});
