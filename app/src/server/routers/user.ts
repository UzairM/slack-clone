import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
  customStatus: z.string().optional(),
});

export const userRouter = router({
  me: publicProcedure.query(async () => {
    // TODO: Implement actual user fetch
    return null as z.infer<typeof userSchema> | null;
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        status: z.enum(['online', 'offline', 'away', 'busy']),
        customStatus: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement actual status update
      return { success: true };
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement actual profile update
      return { success: true };
    }),
});
