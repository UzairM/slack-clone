import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.user.create({
        data: input,
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ input: id }) => {
    // First delete all related records
    await prisma.$transaction([
      // Delete user's message reactions
      prisma.messageReaction.deleteMany({
        where: { userId: id },
      }),
      // Delete user's messages
      prisma.message.deleteMany({
        where: { senderId: id },
      }),
      // Find and update channels to remove user from members
      prisma.$executeRaw`UPDATE "Channel" SET members = array_remove(members, ${id}) WHERE ${id} = ANY(members)`,
      // Delete channels owned by user
      prisma.channel.deleteMany({
        where: { ownerId: id },
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }),
});
