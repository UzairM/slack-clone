import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient, EventType, MatrixClient, MsgType } from 'matrix-js-sdk';
import path from 'path';
import readline from 'readline';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.bot');
dotenv.config({ path: envPath });

// Validate required environment variables
const MATRIX_HOMESERVER_URL = process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
const PINECONE_INDEX = process.env.NEXT_PUBLIC_PINECONE_INDEX;

if (!MATRIX_HOMESERVER_URL || !OPENAI_API_KEY || !PINECONE_API_KEY || !PINECONE_INDEX) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// After validation, we can safely assert types
const homeserverUrl = MATRIX_HOMESERVER_URL as string;
const pineconeIndex = PINECONE_INDEX as string;

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY,
  modelName: process.env.NEXT_PUBLIC_OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-large',
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Type for our chat messages
interface ChatMessage {
  sender: 'human1' | 'human2';
  content: string;
  timestamp: number;
}

// Type for persona mapping matching the seed-personas module
type PersonaMapping = {
  human1: {
    userId: string;
    displayName: string;
    personality: string;
    tone: string;
    interests: string[];
    responseStyle: string;
  };
  human2: {
    userId: string;
    displayName: string;
    personality: string;
    tone: string;
    interests: string[];
    responseStyle: string;
  };
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question with hidden input option
function question(query: string, hidden = false): Promise<string> {
  return new Promise(resolve => {
    if (!hidden) {
      rl.question(query, resolve);
      return;
    }

    // Handle hidden input (passwords)
    const stdin = process.stdin;
    const stdout = process.stdout;
    let input = '';

    stdin.resume();
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write(query);

    stdin.on('data', (data: Buffer) => {
      const char = data.toString();

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdout.write('\n');
          stdin.setRawMode(false);
          stdin.pause();
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          stdout.write('\n');
          process.exit();
          break;
        case '\u007F': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          const code = data[0];
          if (code >= 32) {
            // Printable characters
            input += char;
            stdout.write('*');
          }
          break;
      }
    });
  });
}

// Validate room ID format
function validateRoomId(roomId: string): boolean {
  return roomId.startsWith('!') && roomId.includes(':');
}

// Parse the chat file and convert to our format
function parseChat(filePath: string): ChatMessage[] {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const BASE_TIME = Date.now() - TWO_DAYS_MS;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  return lines.map((line, index) => {
    const [sender, ...contentParts] = line.split(':');
    const content = contentParts.join(':').trim();

    return {
      sender: sender.trim().toLowerCase().replace(' ', '') as 'human1' | 'human2',
      content,
      timestamp: BASE_TIME + index * 60 * 1000,
    };
  });
}

// Login to Matrix and get client
async function loginUser(
  homeserver: string,
  username: string,
  password: string
): Promise<MatrixClient> {
  const client = createClient({ baseUrl: homeserver });

  try {
    await client.login('m.login.password', {
      user: username,
      password: password,
    });
    console.log(`Successfully logged in as ${username}`);
    return client;
  } catch (error) {
    console.error(`Failed to login as ${username}:`, error);
    throw error;
  }
}

// Ensure user is in room
async function ensureInRoom(client: MatrixClient, roomId: string): Promise<void> {
  try {
    await client.joinRoom(roomId);
    console.log(`Ensured ${client.getUserId()} is in room ${roomId}`);
  } catch (err) {
    const error = err as { errcode?: string };
    if (error.errcode !== 'M_FORBIDDEN') {
      console.error(`Failed to join room ${roomId}:`, error);
      throw error;
    }
    // If forbidden, we're probably already in the room
    console.log(`${client.getUserId()} is already in room ${roomId}`);
  }
}

// Send message and ingest to Pinecone
async function sendAndIngestMessage(
  client: MatrixClient,
  roomId: string,
  content: string,
  senderId: string,
  timestamp: number
): Promise<void> {
  try {
    // Send message to Matrix
    const result = await client.sendEvent(roomId, EventType.RoomMessage, {
      msgtype: MsgType.Text,
      body: content,
    });

    // Wait a bit for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get embeddings for the message
    const embedding = await embeddings.embedQuery(content);

    // Create the Pinecone record
    const record = {
      id: result.event_id,
      values: embedding,
      metadata: {
        messageId: result.event_id,
        roomId,
        senderId,
        content,
        timestamp,
        type: 'text',
        userId: senderId,
      },
    };

    // Get Pinecone index
    const index = pinecone.Index(pineconeIndex);

    // Upsert the record to Pinecone
    await index.upsert([record]);

    // Add a small delay after ingestion
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to send or ingest message:', error.message);
      // Log additional error details if available
      if ('cause' in error) {
        console.error('Cause:', error.cause);
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

// Define persona mappings
const personaMapping: PersonaMapping = {
  human1: {
    userId: '@human1:localhost',
    displayName: 'Human 1',
    personality: 'curious, casual, and adventure-loving',
    tone: 'friendly and laid-back',
    interests: [
      'meeting new people',
      'traveling',
      'hiking',
      'outdoor activities',
      'social interactions',
    ],
    responseStyle: 'concise and casual with occasional emojis',
  },
  human2: {
    userId: '@human2:localhost',
    displayName: 'Human 2',
    personality: 'spiritual, empathetic, and hardworking',
    tone: 'warm and expressive',
    interests: [
      'spirituality',
      'human connections',
      'helping others',
      'treasure hunting',
      'work',
      'travel',
    ],
    responseStyle: 'detailed and emotionally aware, uses emojis to express feelings',
  },
};

// Constants for message sending
const MESSAGE_DELAY_MS = 1; // 1 second delay between messages
const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10 messages

async function main() {
  try {
    console.log('Starting chat parsing and persona seeding...');
    console.log(`Using Matrix homeserver: ${homeserverUrl}`);
    console.log(`Message delay: ${MESSAGE_DELAY_MS}ms`);

    // Get room ID
    let roomId = '!SIRiRzkCbemSUwifkQ:16.171.170.149';

    // Get Human 1 credentials
    console.log('\nHuman 1 Login:');
    const username1 = 'allen';
    const password1 = '1234';

    // Get Human 2 credentials
    console.log('\nHuman 2 Login:');
    const username2 = 'joe';
    const password2 = '1234';

    // Parse the chat file - Fix the path to look in the root documentation folder
    const chatPath = path.join(process.cwd(), '..', 'documentation', 'human_chat.txt');
    console.log('Looking for chat file at:', chatPath);

    const messages = parseChat(chatPath);
    console.log(`Parsed ${messages.length} messages from chat file`);

    // Login both users
    const client1 = await loginUser(homeserverUrl, username1, password1);
    const client2 = await loginUser(homeserverUrl, username2, password2);

    // Ensure both users are in the room
    await ensureInRoom(client1, roomId);
    await ensureInRoom(client2, roomId);

    // Send messages as appropriate users
    console.log('Sending messages...');
    let messagesSent = 0;
    const totalMessages = messages.length;
    const startTime = Date.now();

    for (const msg of messages) {
      const client = msg.sender === 'human1' ? client1 : client2;
      const senderId = msg.sender === 'human1' ? '@testuser3:localhost' : '@testuser11:localhost';

      // Send and ingest the message
      await sendAndIngestMessage(client, roomId, msg.content, senderId, msg.timestamp);
      messagesSent++;

      // Update progress periodically
      if (messagesSent % PROGRESS_UPDATE_INTERVAL === 0 || messagesSent === totalMessages) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const messagesPerSecond = messagesSent / elapsedSeconds;
        process.stdout.write(
          `\rProgress: ${messagesSent}/${totalMessages} messages (${Math.round((messagesSent / totalMessages) * 100)}%) | Rate: ${messagesPerSecond.toFixed(2)} msg/s | Elapsed: ${elapsedSeconds.toFixed(1)}s`
        );
      }

      // Add delay before next message, but skip delay for the last message
      if (messagesSent < totalMessages) {
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY_MS));
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nMessage seeding completed in ${totalTime}s`);

    // Cleanup
    await client1.stopClient();
    await client2.stopClient();
    rl.close();
  } catch (error) {
    console.error('Error seeding messages:', error);
    rl.close();
    process.exit(1);
  }
}

main();
