import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['public', 'private', 'direct']),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      avatar: z.string().optional(),
      status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
      customStatus: z.string().optional(),
    })
  ),
  lastMessage: z
    .object({
      id: z.string(),
      content: z.string(),
      sender: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional(),
      }),
      timestamp: z.date(),
    })
    .optional(),
  unreadCount: z.number(),
});

export const channelsRouter = router({
  list: publicProcedure.query(async () => {
    // TODO: Implement actual database query
    return [] as z.infer<typeof channelSchema>[];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(['public', 'private', 'direct']),
        memberIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement actual channel creation
      return {
        id: 'temp-id',
        name: input.name,
        type: input.type,
        members: [],
        unreadCount: 0,
      } as z.infer<typeof channelSchema>;
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ input: channelId }) => {
      // TODO: Implement actual channel deletion
      return { success: true };
    }),
});
