import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  channelId: z.string(),
  sender: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().optional(),
  }),
  timestamp: z.date(),
});

export type Message = z.infer<typeof messageSchema>;

export const messagesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implement actual database query
      const items: Message[] = [];
      const { limit, cursor } = input;

      return {
        items,
        nextCursor: items.length === limit ? cursor + limit : undefined,
        prevCursor: cursor > 0 ? cursor - limit : undefined,
      };
    }),

  send: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement actual message sending
      return {
        success: true,
        message: {
          id: 'temp-id',
          content: input.content,
          channelId: input.channelId,
          sender: {
            id: 'user-id',
            name: 'Test User',
            email: 'test@example.com',
          },
          timestamp: new Date(),
        } satisfies Message,
      };
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ input: messageId }) => {
    // TODO: Implement actual message deletion
    return { success: true };
  }),
});
