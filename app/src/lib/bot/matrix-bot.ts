import {
  createClient,
  EventType,
  MatrixClient,
  MatrixEvent,
  MsgType,
  RoomEvent,
  RoomMember,
  RoomMemberEvent,
} from '@/lib/matrix/sdk';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { messageIngestion } from '../ai/message-ingestion';

interface PineconeMetadata {
  text: string;
  [key: string]: any;
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: PineconeMetadata;
  values?: number[];
}

export class MatrixBot {
  private client: MatrixClient | null = null;
  private openai: OpenAI;
  private pineconeClient: Pinecone | null = null;
  private pineconeIndex: any = null;
  private chatModel: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private isRunning: boolean = false;
  private readonly pollingInterval: number;
  private readonly callbacks = [new ConsoleCallbackHandler()];
  private lastSyncTimestamp: number = 0;
  private processedMessageIds: Set<string> = new Set();

  constructor(
    private readonly homeserverUrl: string,
    private readonly username: string,
    private readonly password: string,
    private readonly openaiApiKey: string,
    private readonly openaiModel: string = 'gpt-4-turbo-preview',
    pollingIntervalMs?: number
  ) {
    this.homeserverUrl = process.env.DOCKER
      ? this.homeserverUrl.replace('localhost', 'synapse')
      : this.homeserverUrl;
    this.openai = new OpenAI({
      apiKey: this.openaiApiKey,
    });
    this.pollingInterval = pollingIntervalMs || 5000;

    // Configure LangSmith tracing
    process.env.LANGCHAIN_TRACING_V2 = process.env.NEXT_PUBLIC_LANGCHAIN_TRACING_V2;
    process.env.LANGCHAIN_API_KEY = process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY;
    process.env.LANGCHAIN_PROJECT = process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT;

    // Initialize chat model with consistent callbacks and tracing
    this.chatModel = new ChatOpenAI({
      modelName: process.env.NEXT_PUBLIC_OPENAI_MODEL || this.openaiModel,
      temperature: 0.7,
      openAIApiKey: this.openaiApiKey,
      callbacks: this.callbacks,
      verbose: true,
    });

    // Initialize embeddings with consistent callbacks and tracing
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.openaiApiKey,
      modelName: process.env.NEXT_PUBLIC_OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-large',
      dimensions: 3072,
      verbose: true,
    });
  }

  private async initializeVectorStore() {
    try {
      console.log('Initializing Pinecone connection...');

      this.pineconeClient = new Pinecone({
        apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
      });

      this.pineconeIndex = this.pineconeClient.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);

      console.log('Pinecone initialized successfully');
    } catch (error) {
      console.error('Error initializing Pinecone:', error);
      throw error;
    }
  }

  private async getContextualResponse(query: string): Promise<string> {
    try {
      if (!this.pineconeIndex) {
        console.log('Pinecone index not available, falling back to direct response');
        const chain = RunnableSequence.from([
          PromptTemplate.fromTemplate(
            `You are a helpful assistant in a Matrix chat room. Be concise and friendly in your responses.

            Question: {question}`
          ),
          this.chatModel,
          new StringOutputParser(),
        ]).withConfig({ callbacks: this.callbacks });

        return await chain.invoke({ question: query });
      }

      // Try to get contextual response from Pinecone
      try {
        console.log('Generating query embedding...');
        const queryEmbedding = await this.embeddings.embedQuery(query);
        console.log('Generated embedding with dimension:', queryEmbedding.length);

        console.log('Querying Pinecone for similar vectors...');
        const queryResponse = await this.pineconeIndex.query({
          vector: queryEmbedding,
          topK: 3,
          includeMetadata: true,
        });
        console.log('Found matches:', queryResponse.matches?.length || 0);

        // Format documents
        const relevantDocs = queryResponse.matches.map((match: PineconeMatch) => {
          if (match.metadata) {
            console.log('Match similarity:', match.score);
            return new Document({
              pageContent: match.metadata.text || '',
              metadata: { ...match.metadata, similarity: match.score },
            });
          }
          return new Document({
            pageContent: '',
            metadata: { similarity: match.score },
          });
        });

        // Create the RAG prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
          You are a helpful assistant in a Matrix chat room. Be concise and friendly in your responses.
          Use the following context to help answer the question, but don't mention that you're using any context.
          If the context isn't relevant, just respond based on your general knowledge.

          Context: {context}

          Question: {question}
        `);

        // Format documents into a string
        const formatDocuments = (docs: Document[]) => {
          return docs.map((doc, i) => `Document ${i + 1}:\n${doc.pageContent}`).join('\n\n');
        };

        console.log('Creating chain with context...');
        // Create the chain with consistent callbacks
        const chain = RunnableSequence.from([
          {
            context: (input: { question: string; context: Document[] }) =>
              formatDocuments(input.context),
            question: (input: { question: string; context: Document[] }) => input.question,
          },
          promptTemplate,
          this.chatModel,
          new StringOutputParser(),
        ]).withConfig({ callbacks: this.callbacks });

        console.log('Executing chain...');
        const response = await chain.invoke({
          question: query,
          context: relevantDocs,
        });
        console.log('Chain execution complete');

        return response;
      } catch (error) {
        console.error('Error in RAG process:', error);
        console.log('Falling back to direct response');

        // Use the same chain structure for fallback
        const chain = RunnableSequence.from([
          PromptTemplate.fromTemplate(
            `You are a helpful assistant in a Matrix chat room. Be concise and friendly in your responses.

            Question: {question}`
          ),
          this.chatModel,
          new StringOutputParser(),
        ]).withConfig({ callbacks: this.callbacks });

        return await chain.invoke({ question: query });
      }
    } catch (error) {
      console.error('Error getting response:', error);
      throw error;
    }
  }

  private async login(): Promise<{ access_token: string; user_id: string }> {
    // Create a temporary client for login
    const tempClient = createClient({
      baseUrl: this.homeserverUrl,
      device_id: this.username, // Add device ID during login
    });

    try {
      const response = await tempClient.login('m.login.password', {
        user: this.username,
        password: this.password,
        device_id: this.username, // Include device ID in login request
      });

      return {
        access_token: response.access_token,
        user_id: response.user_id,
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  private async checkMissedMessages() {
    if (!this.client || !this.pineconeIndex) return;

    try {
      console.log('Checking for missed messages...');
      const rooms = this.client.getRooms();

      // Query Pinecone for the latest message timestamp
      const latestMessageQuery = await this.pineconeIndex.query({
        vector: await this.embeddings.embedQuery(''), // Dummy vector for metadata-only query
        topK: 1,
        filter: {
          timestamp: { $exists: true },
        },
        includeMetadata: true,
      });

      const latestPineconeTimestamp = latestMessageQuery.matches[0]?.metadata?.timestamp || 0;
      this.lastSyncTimestamp = Math.max(this.lastSyncTimestamp, latestPineconeTimestamp);

      for (const room of rooms) {
        try {
          // Get only recent messages since last sync
          const timeline = room.getLiveTimeline();
          const events = timeline.getEvents();

          // Filter for new message events only
          const missedMessages = events.filter(event => {
            const isMessage = event.getType() === EventType.RoomMessage;
            const isAfterLastSync = event.getTs() > this.lastSyncTimestamp;
            const notProcessed = !this.processedMessageIds.has(event.getId() || '');
            return isMessage && isAfterLastSync && notProcessed;
          });

          if (missedMessages.length > 0) {
            console.log(`Found ${missedMessages.length} missed messages in room ${room.name}`);

            // Process missed messages
            for (const event of missedMessages) {
              const messageId = event.getId();
              if (!messageId) continue;

              try {
                const relation = event.getRelation();
                const replyToId = relation?.['m.in_reply_to']?.event_id;

                await messageIngestion.ingestMessage({
                  messageId,
                  roomId: room.roomId,
                  senderId: event.getSender() || '',
                  timestamp: event.getTs(),
                  content: event.getContent()?.body || '',
                  type: event.getContent()?.msgtype || 'm.text',
                  threadId: event.threadRootId,
                  replyTo: replyToId
                    ? {
                        id: replyToId,
                        content: room.findEventById(replyToId)?.getContent()?.body || '',
                        sender: room.findEventById(replyToId)?.getSender() || '',
                      }
                    : undefined,
                });

                // Mark message as processed
                this.processedMessageIds.add(messageId);
              } catch (error) {
                console.error(`Failed to ingest missed message ${messageId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing missed messages for room ${room.name}:`, error);
          continue;
        }
      }

      // Update last sync timestamp
      this.lastSyncTimestamp = Date.now();
      console.log('Missed message check complete');
    } catch (error) {
      console.error('Error checking missed messages:', error);
    }
  }

  private formatTimestamp(timestamp: number | undefined): string {
    if (!timestamp) return 'never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  }

  private async isBotOnlyInstance(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Get all devices for the bot's account
      const devices = await this.client.getDevices();
      const currentDeviceId = this.username; // Use our known device ID

      console.log('\nCurrent devices:');
      devices.devices.forEach(device => {
        const isCurrent = device.device_id === currentDeviceId;
        console.log(
          `- ${device.device_id}: ${device.display_name || 'unnamed'} (Last seen: ${this.formatTimestamp(device.last_seen_ts)})${isCurrent ? ' (Current)' : ''}`
        );
      });

      console.log('\nCurrent device ID:', currentDeviceId);

      // Filter for recently active devices (excluding our current device)
      const recentlyActiveDevices = devices.devices.filter(device => {
        // Skip our own device
        if (device.device_id === currentDeviceId) {
          console.log(`\nSkipping current device ${device.device_id}`);
          return false;
        }

        const lastSeenTimestamp = device.last_seen_ts || 0;
        const minutesSinceLastSeen = (Date.now() - lastSeenTimestamp) / (1000 * 60);
        const isRecentlyActive = minutesSinceLastSeen < 1; // Less than 1 minute ago

        console.log(`\nDevice ${device.device_id} status:`, {
          name: device.display_name || 'unnamed',
          isCurrent: device.device_id === currentDeviceId,
          isRecentlyActive,
          minutesSinceLastSeen: Math.round(minutesSinceLastSeen * 10) / 10,
          lastSeen: this.formatTimestamp(device.last_seen_ts),
        });

        return isRecentlyActive;
      });

      const shouldRespond = recentlyActiveDevices.length === 0;
      console.log('\nOther recently active devices:', recentlyActiveDevices.length);
      console.log('Should respond:', shouldRespond, '(no other devices seen in last minute)');

      return shouldRespond;
    } catch (error) {
      console.error('Error checking bot devices:', error);
      return true; // Default to responding if we can't check devices
    }
  }

  public async start() {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    try {
      // Initialize vector store
      await this.initializeVectorStore();

      // Login and get access token
      console.log('Logging in...');
      const { access_token, user_id } = await this.login();
      console.log('Login successful');

      // Create the client with the access token and a consistent device ID
      this.client = createClient({
        baseUrl: this.homeserverUrl,
        accessToken: access_token,
        userId: user_id,
        device_id: this.username, // Consistent device ID
      });

      // Set a recognizable display name for the device
      try {
        await this.client.setDisplayName(this.username);
      } catch (error) {
        console.error('Error setting device display name:', error);
      }

      // Start the client
      await this.client.startClient({ initialSyncLimit: 10 });
      this.isRunning = true;

      // Check for missed messages on startup
      await this.checkMissedMessages();

      // Set up periodic missed message check (every 5 minutes)
      setInterval(
        () => {
          this.checkMissedMessages();
        },
        5 * 60 * 1000
      );

      // Auto-join public rooms
      await this.joinPublicRooms();

      // Listen for room messages
      this.client.on(RoomEvent.Timeline, async (event, room) => {
        if (!room) return;
        if (event.getType() !== EventType.RoomMessage) return;
        if (event.getSender() === user_id) return; // Ignore own messages
        if (!event.getContent()?.body) return;

        const messageContent = event.getContent().body;

        // Check if bot is the only active instance
        const isOnlyInstance = await this.isBotOnlyInstance();
        console.log('Is bot the only instance?', isOnlyInstance);

        // Only respond if the bot is the only active instance
        if (!isOnlyInstance) {
          console.log('Skipping message - other instances are active');
          return;
        }

        console.log('Processing message as sole active instance');

        try {
          // Get contextual AI response with bot-only prefix
          const response = `[Automated Response]\n${await this.getContextualResponse(messageContent.trim())}`;

          // Send response back to the room
          await this.client!.sendMessage(room.roomId, {
            msgtype: MsgType.Text,
            body: response,
          });
        } catch (error) {
          console.error('Error processing message:', error);
          await this.client!.sendMessage(room.roomId, {
            msgtype: MsgType.Text,
            body: 'I apologize, but I encountered an error processing your message.',
          });
        }
      });

      // Listen for new room invites
      this.client.on(RoomMemberEvent.Membership, async (event: MatrixEvent, member: RoomMember) => {
        if (member?.membership === 'invite' && member.userId === user_id) {
          try {
            const roomId = event.getRoomId();
            if (roomId) {
              await this.joinRoom(roomId);
              console.log(`Joined room ${roomId} after invite`);
            }
          } catch (error) {
            console.error('Error joining room after invite:', error);
          }
        }
      });

      // Start polling for new rooms
      this.startPollingForRooms();

      console.log('Bot started successfully');
    } catch (error) {
      console.error('Error starting bot:', error);
      this.isRunning = false;
      throw error;
    }
  }

  private async startPollingForRooms() {
    // Keep track of known rooms
    let knownRoomIds = new Set<string>();

    // Initial population of known rooms
    if (this.client) {
      const rooms = this.client.getRooms();
      rooms.forEach(room => knownRoomIds.add(room.roomId));
    }

    console.log(`Starting room polling with interval: ${this.pollingInterval}ms`);

    // Poll at the configured interval
    setInterval(async () => {
      if (!this.client || !this.isRunning) return;

      try {
        // Get current list of public rooms
        const serverUrl = new URL(this.homeserverUrl);
        const serverName = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME || 'localhost';
        const response = await this.client.publicRooms({
          limit: 1000,
          server: serverName,
        });

        // Check each room
        for (const room of response.chunk) {
          if (!knownRoomIds.has(room.room_id)) {
            console.log(`Found new room: ${room.name || room.room_id}`);

            // Add to known rooms
            knownRoomIds.add(room.room_id);

            try {
              // Check if we're already in the room
              const existingRoom = this.client.getRoom(room.room_id);
              if (!existingRoom || existingRoom.getMyMembership() !== 'join') {
                await this.joinRoom(room.room_id);
                console.log(`Joined new room: ${room.name || room.room_id}`);

                // Send greeting message
                await this.client.sendMessage(room.room_id, {
                  msgtype: MsgType.Text,
                  body: "Hello! I'm an AI assistant bot. I'll be here to help answer any questions you might have.",
                });
              }
            } catch (error) {
              console.error(`Error joining room ${room.room_id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error polling for rooms:', error);
      }
    }, this.pollingInterval);
  }

  public async joinRoom(roomId: string) {
    if (!this.client) return;

    try {
      await this.client.joinRoom(roomId);
      console.log(`Joined room: ${roomId}`);
    } catch (error) {
      console.error(`Error joining room ${roomId}:`, error);
      throw error;
    }
  }

  private async joinPublicRooms() {
    if (!this.client) return;

    try {
      console.log('Fetching public rooms...');
      const serverName = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME || 'localhost';

      // Get list of public rooms
      const response = await this.client.publicRooms({
        limit: 1000,
        server: serverName,
      });

      console.log(`Found ${response.chunk.length} public rooms`);

      // Join each public room that we're not already in
      for (const room of response.chunk) {
        try {
          const existingRoom = this.client.getRoom(room.room_id);
          if (!existingRoom || existingRoom.getMyMembership() !== 'join') {
            await this.joinRoom(room.room_id);
            console.log(`Joined public room: ${room.name || room.room_id}`);
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to join room ${room.room_id}:`, error);
          continue;
        }
      }

      console.log('Finished joining public rooms');
    } catch (error) {
      console.error('Error joining public rooms:', error);
      throw error;
    }
  }

  public async stop() {
    if (!this.isRunning || !this.client) {
      console.log('Bot is not running');
      return;
    }

    try {
      await this.client.stopClient();
      this.isRunning = false;
      console.log('Bot stopped successfully');
    } catch (error) {
      console.error('Error stopping bot:', error);
      throw error;
    }
  }
}
