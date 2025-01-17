import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.bot file
const envPath = path.resolve(process.cwd(), '.env.bot');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Now import other modules
import { MatrixBot } from './matrix-bot';

// Get environment variables
const {
  NEXT_PUBLIC_MATRIX_HOMESERVER_URL: homeserverUrl,
  NEXT_PUBLIC_MATRIX_USERNAME: username,
  NEXT_PUBLIC_MATRIX_PASSWORD: password,
  NEXT_PUBLIC_OPENAI_API_KEY: openaiApiKey,
  NEXT_PUBLIC_OPENAI_MODEL: openaiModel,
  NEXT_PUBLIC_MATRIX_ROOM_POLLING_INTERVAL: pollingIntervalStr,
  NEXT_PUBLIC_PINECONE_API_KEY,
  NEXT_PUBLIC_PINECONE_ENVIRONMENT,
  NEXT_PUBLIC_PINECONE_INDEX,
} = process.env;

// Log loaded environment variables (without sensitive values)
console.log('Loaded environment variables:', {
  NEXT_PUBLIC_MATRIX_HOMESERVER_URL: !!homeserverUrl,
  NEXT_PUBLIC_MATRIX_USERNAME: !!username,
  NEXT_PUBLIC_OPENAI_API_KEY: !!openaiApiKey,
  NEXT_PUBLIC_PINECONE_API_KEY: !!NEXT_PUBLIC_PINECONE_API_KEY,
  NEXT_PUBLIC_PINECONE_INDEX: NEXT_PUBLIC_PINECONE_INDEX,
});

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_MATRIX_HOMESERVER_URL: homeserverUrl,
  NEXT_PUBLIC_MATRIX_USERNAME: username,
  NEXT_PUBLIC_MATRIX_PASSWORD: password,
  NEXT_PUBLIC_OPENAI_API_KEY: openaiApiKey,
  NEXT_PUBLIC_PINECONE_API_KEY: NEXT_PUBLIC_PINECONE_API_KEY,
  NEXT_PUBLIC_PINECONE_ENVIRONMENT: NEXT_PUBLIC_PINECONE_ENVIRONMENT,
  NEXT_PUBLIC_PINECONE_INDEX: NEXT_PUBLIC_PINECONE_INDEX,
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
  pineconeEnvironment: NEXT_PUBLIC_PINECONE_ENVIRONMENT,
  pineconeIndex: NEXT_PUBLIC_PINECONE_INDEX,
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
