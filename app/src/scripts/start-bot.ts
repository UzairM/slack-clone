import dotenv from 'dotenv';
import path from 'path';
import { MatrixBot } from '../lib/bot/matrix-bot';

// Load environment variables from .env.bot
dotenv.config({ path: path.resolve(process.cwd(), '.env.bot') });

async function main() {
  // Check required environment variables
  const requiredEnvVars = [
    'MATRIX_SERVER_URL',
    'MATRIX_USERNAME',
    'MATRIX_PASSWORD',
    'OPENAI_API_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Create and start the bot
  const bot = new MatrixBot(
    process.env.MATRIX_SERVER_URL!,
    process.env.MATRIX_USERNAME!,
    process.env.MATRIX_PASSWORD!,
    process.env.OPENAI_API_KEY!,
    process.env.OPENAI_MODEL || 'gpt-3.5-turbo' // Use default if not specified
  );

  try {
    console.log(`Starting bot with OpenAI model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
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

main().catch(console.error);
