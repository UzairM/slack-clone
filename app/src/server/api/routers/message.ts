import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// In-memory message store for testing
let messages: Array<{
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: Date;
}> = [];

export const messageRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filteredMessages = [...messages];

      // Handle cursor-based pagination
      if (input.cursor) {
        const cursorIndex = messages.findIndex(msg => msg.id === input.cursor);
        if (cursorIndex !== -1) {
          filteredMessages = messages.slice(cursorIndex + 1);
        }
      }

      // Apply limit
      filteredMessages = filteredMessages.slice(0, input.limit);

      return {
        messages: filteredMessages,
        nextCursor: filteredMessages[filteredMessages.length - 1]?.id,
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        channelId: z.string(),
        authorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMessage = {
        id: Date.now().toString(),
        content: input.content,
        channelId: input.channelId,
        authorId: input.authorId,
        createdAt: new Date(),
      };

      messages.unshift(newMessage);

      return newMessage;
    }),
});
