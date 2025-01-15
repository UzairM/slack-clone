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

  constructor(
    private readonly homeserverUrl: string,
    private readonly username: string,
    private readonly password: string,
    private readonly openaiApiKey: string,
    private readonly openaiModel: string = 'gpt-3.5-turbo',
    pollingIntervalMs?: number
  ) {
    this.openai = new OpenAI({
      apiKey: this.openaiApiKey,
    });
    this.pollingInterval = pollingIntervalMs || 5000;

    // Initialize chat model with consistent callbacks
    this.chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || this.openaiModel,
      temperature: 0.7,
      openAIApiKey: this.openaiApiKey,
      callbacks: this.callbacks,
      verbose: true,
    });

    // Initialize embeddings with consistent callbacks
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.openaiApiKey,
      modelName: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-large',
      dimensions: 3072,
      verbose: true,
    });
  }

  private async initializeVectorStore() {
    try {
      console.log('Initializing Pinecone connection...');

      this.pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });

      this.pineconeIndex = this.pineconeClient.Index(process.env.PINECONE_INDEX!);

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
    });

    try {
      const response = await tempClient.login('m.login.password', {
        user: this.username,
        password: this.password,
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

      // Create the client with the access token
      this.client = createClient({
        baseUrl: this.homeserverUrl,
        accessToken: access_token,
        userId: user_id,
      });

      // Start the client
      await this.client.startClient({ initialSyncLimit: 10 });
      this.isRunning = true;

      // Auto-join public rooms
      await this.joinPublicRooms();

      // Listen for room messages
      this.client.on(RoomEvent.Timeline, async (event, room) => {
        if (!room) return;
        if (event.getType() !== EventType.RoomMessage) return;
        if (event.getSender() === user_id) return; // Ignore own messages
        if (!event.getContent()?.body) return;

        const messageContent = event.getContent().body;

        try {
          // Get contextual AI response
          const response = await this.getContextualResponse(messageContent);

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
        const serverName = serverUrl.hostname;
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

  private async joinPublicRooms() {
    if (!this.client) return;

    try {
      console.log('Fetching public rooms...');
      const serverUrl = new URL(this.homeserverUrl);
      const serverName = serverUrl.hostname;

      // Get list of public rooms
      const response = await this.client.publicRooms({
        limit: 1000, // Adjust this number based on your needs
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
          // Continue with next room even if this one fails
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
}
