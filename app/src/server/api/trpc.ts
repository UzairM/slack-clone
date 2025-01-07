import { initTRPC, type inferAsyncReturnType } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

interface CreateContextOptions {
  // Add any context options here
  session: null | {
    user: {
      id: string;
      name: string;
    };
  };
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
  };
};

export const createTRPCContext = async () => {
  // For now, we're not using any session
  return createInnerTRPCContext({ session: null });
};

type Context = inferAsyncReturnType<typeof createTRPCContext>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
