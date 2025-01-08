import { z } from 'zod';
import { redisRouter } from './routers/redis';
import { testErrorRouter } from './routers/test-errors';
import { createTRPCRouter, publicProcedure } from './trpc';

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string(),
        age: z.number(),
      })
    )
    .query(({ input }) => ({
      greeting: `Hello ${input.name}, you are ${input.age} years old!`,
      timestamp: new Date(),
    })),
  test: testErrorRouter,
  redis: redisRouter,
});

export type AppRouter = typeof appRouter;
