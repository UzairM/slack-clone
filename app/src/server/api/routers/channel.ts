import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const channelRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: true,
        members: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(['public', 'private', 'direct']),
        ownerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.channel.create({
        data: {
          name: input.name,
          type: input.type,
          owner: {
            connect: { id: input.ownerId },
          },
          members: {
            connect: { id: input.ownerId },
          },
        },
        include: {
          owner: true,
          members: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ input: id }) => {
    await prisma.$transaction([
      // Delete all messages in the channel
      prisma.message.deleteMany({
        where: { channelId: id },
      }),
      // Delete the channel
      prisma.channel.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }),
});
