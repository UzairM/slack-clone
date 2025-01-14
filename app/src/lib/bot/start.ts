import dotenv from 'dotenv';
import { MatrixBot } from './matrix-bot';

// Load environment variables from .env.bot file
dotenv.config({ path: '.env.bot' });

// Get environment variables
const homeserverUrl = process.env.MATRIX_HOMESERVER_URL;
const username = process.env.MATRIX_USERNAME;
const password = process.env.MATRIX_PASSWORD;
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL;
const pollingInterval = parseInt(process.env.MATRIX_ROOM_POLLING_INTERVAL || '5000', 10);

// Check required environment variables
if (!homeserverUrl || !username || !password || !openaiApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create and start the bot
const bot = new MatrixBot(
  homeserverUrl,
  username,
  password,
  openaiApiKey,
  openaiModel,
  pollingInterval
);

bot.start().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
