import dotenv from 'dotenv';
import path from 'path';
import { MatrixBot } from './matrix-bot';

// Load environment variables from .env.bot file
const envPath = path.resolve(process.cwd(), '.env.bot');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Get environment variables
const {
  MATRIX_HOMESERVER_URL: homeserverUrl,
  MATRIX_USERNAME: username,
  MATRIX_PASSWORD: password,
  OPENAI_API_KEY: openaiApiKey,
  OPENAI_MODEL: openaiModel,
  MATRIX_ROOM_POLLING_INTERVAL: pollingIntervalStr,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX,
} = process.env;

// Validate required environment variables
const requiredEnvVars = {
  MATRIX_HOMESERVER_URL: homeserverUrl,
  MATRIX_USERNAME: username,
  MATRIX_PASSWORD: password,
  OPENAI_API_KEY: openaiApiKey,
  PINECONE_API_KEY: PINECONE_API_KEY,
  PINECONE_ENVIRONMENT: PINECONE_ENVIRONMENT,
  PINECONE_INDEX: PINECONE_INDEX,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([name]) => name);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const pollingInterval = parseInt(pollingIntervalStr || '5000', 10);

// Log configuration (without sensitive values)
console.log('Bot Configuration:', {
  homeserverUrl,
  username,
  model: openaiModel,
  pollingInterval,
  pineconeEnvironment: PINECONE_ENVIRONMENT,
  pineconeIndex: PINECONE_INDEX,
});

// Create and start the bot
const bot = new MatrixBot(
  homeserverUrl!,
  username!,
  password!,
  openaiApiKey!,
  openaiModel,
  pollingInterval
);

bot.start().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
