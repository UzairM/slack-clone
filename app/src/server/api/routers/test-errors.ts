import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Custom error types
interface CustomErrorData {
  type: string;
  timestamp: Date;
  details: string;
}

interface RateLimitErrorData {
  retryAfter: number;
  limit: number;
  timeWindow: string;
}

// Test validation schema with complex rules
const userInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
});

export const testErrorRouter = createTRPCRouter({
  // Test Zod validation errors
  validateInput: publicProcedure.input(userInputSchema).mutation(({ input }) => {
    return {
      success: true,
      data: input,
    };
  }),

  // Test custom error with specific code
  unauthorized: publicProcedure.query(() => {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }),

  // Test not found error
  notFound: publicProcedure.input(z.string()).query(({ input }) => {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Resource with ID ${input} not found`,
    });
  }),

  // Test internal server error
  serverError: publicProcedure.query(() => {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on the server',
    });
  }),

  // Test custom error with additional metadata
  customError: publicProcedure.input(z.object({ type: z.string() })).mutation(({ input }) => {
    const errorData: CustomErrorData = {
      type: input.type,
      timestamp: new Date(),
      details: 'Additional error details',
    };

    throw Object.assign(
      new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Custom error occurred',
        cause: new Error('Original error cause'),
      }),
      { data: errorData }
    );
  }),

  // Test timeout error
  timeout: publicProcedure.query(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    throw new TRPCError({
      code: 'TIMEOUT',
      message: 'Request timed out',
    });
  }),

  // Test rate limiting error
  rateLimited: publicProcedure.mutation(() => {
    const errorData: RateLimitErrorData = {
      retryAfter: 60,
      limit: 100,
      timeWindow: '1 hour',
    };

    throw Object.assign(
      new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      }),
      { data: errorData }
    );
  }),
});
