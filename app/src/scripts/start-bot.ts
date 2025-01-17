import dotenv from 'dotenv';
import path from 'path';
import { MatrixBot } from '../lib/bot/matrix-bot';

async function main() {
  // Load environment variables from .env.bot
  const envPath = path.resolve(process.cwd(), process.env.DOCKER ? '.env.bot.docker' : '.env.bot');
  console.log('Loading environment from:', envPath);
  dotenv.config({ path: envPath });

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_MATRIX_HOMESERVER_URL',
    'NEXT_PUBLIC_MATRIX_SERVER_NAME',
    'NEXT_PUBLIC_MATRIX_USERNAME',
    'NEXT_PUBLIC_MATRIX_PASSWORD',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'NEXT_PUBLIC_PINECONE_API_KEY',
    'NEXT_PUBLIC_PINECONE_ENVIRONMENT',
    'NEXT_PUBLIC_PINECONE_INDEX',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Create and start the bot
  const bot = new MatrixBot(
    process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL!,
    process.env.NEXT_PUBLIC_MATRIX_USERNAME!,
    process.env.NEXT_PUBLIC_MATRIX_PASSWORD!,
    process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview' // Use default if not specified
  );

  try {
    console.log(
      `Starting bot with OpenAI model: ${process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview'}`
    );
    await bot.start();
    console.log('Bot is running and auto-joining public rooms...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down bot...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down bot...');
      await bot.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
