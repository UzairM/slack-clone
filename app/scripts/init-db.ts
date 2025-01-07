import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@example.com',
        status: 'online',
      },
    });

    // Create general channel
    const channel = await prisma.channel.create({
      data: {
        name: 'general',
        type: 'public',
        description: 'General discussion channel',
        owner: {
          connect: { id: user.id },
        },
        members: {
          connect: [{ id: user.id }],
        },
      },
    });

    // Create welcome message
    await prisma.message.create({
      data: {
        content: 'Welcome to ChatGenius! 👋',
        channel: {
          connect: { id: channel.id },
        },
        sender: {
          connect: { id: user.id },
        },
      },
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
