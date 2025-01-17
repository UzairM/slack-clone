import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

export interface MessageMetadata {
  messageId: string;
  roomId: string;
  senderId: string;
  timestamp: number;
  content: string;
  type: string;
  threadId?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
}

export class MessageIngestionService {
  private pineconeClient: Pinecone | null = null;
  private pineconeIndex: any = null;
  private embeddings: OpenAIEmbeddings | null = null;

  constructor() {
    // We'll initialize these in the initialize() method
  }

  async initialize() {
    try {
      // Configure LangSmith tracing
      if (typeof window === 'undefined') {
        process.env.LANGCHAIN_TRACING_V2 = process.env.NEXT_PUBLIC_LANGCHAIN_TRACING_V2;
        process.env.LANGCHAIN_API_KEY = process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY;
        process.env.LANGCHAIN_PROJECT = process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT;
      }

      // Initialize Pinecone client
      const pineconeApiKey = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
      if (!pineconeApiKey) {
        console.warn('Pinecone API key not found, message ingestion will be disabled');
        return;
      }

      this.pineconeClient = new Pinecone({
        apiKey: pineconeApiKey,
      });

      const pineconeIndex = process.env.NEXT_PUBLIC_PINECONE_INDEX;
      if (!pineconeIndex) {
        console.warn('Pinecone index not found, message ingestion will be disabled');
        return;
      }

      this.pineconeIndex = this.pineconeClient.Index(pineconeIndex);

      // Initialize embeddings
      const openAiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const openAiEmbeddingsModel =
        process.env.NEXT_PUBLIC_OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-large';

      if (!openAiApiKey) {
        console.warn('OpenAI API key not found, message ingestion will be disabled');
        return;
      }

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: openAiApiKey,
        modelName: openAiEmbeddingsModel,
        dimensions: 3072,
        verbose: true,
      });

      console.log('Message ingestion service initialized successfully');
    } catch (error) {
      console.error('Error initializing message ingestion service:', error);
    }
  }

  async ingestMessage(metadata: MessageMetadata) {
    try {
      // Initialize if not already initialized
      if (!this.pineconeIndex || !this.embeddings) {
        await this.initialize();
      }

      // If still not initialized, skip ingestion
      if (!this.pineconeIndex || !this.embeddings) {
        console.warn('Message ingestion is disabled due to missing configuration');
        return;
      }

      console.log('Ingesting message:', {
        id: metadata.messageId,
        content: metadata.content,
        sender: metadata.senderId,
        room: metadata.roomId,
      });

      // Generate embedding for the message content
      const embedding = await this.embeddings.embedQuery(metadata.content);

      // Prepare the record for Pinecone
      const record = {
        id: metadata.messageId,
        values: embedding,
        metadata: {
          roomId: metadata.roomId,
          senderId: metadata.senderId,
          timestamp: metadata.timestamp,
          content: metadata.content,
          type: metadata.type,
          threadId: metadata.threadId,
          replyTo: metadata.replyTo,
        },
      };

      // Upsert the record to Pinecone
      await this.pineconeIndex.upsert([record]);

      console.log('Message ingested successfully:', metadata.messageId);
    } catch (error) {
      console.error('Error ingesting message:', error);
      // Don't throw the error, just log it
    }
  }

  async queryUserMessages(userId: string, limit: number = 10): Promise<MessageMetadata[]> {
    try {
      if (!this.pineconeIndex || !this.embeddings) {
        await this.initialize();
      }

      if (!this.pineconeIndex) {
        console.warn('Message querying is disabled due to missing configuration');
        return [];
      }

      // Query messages by user ID
      const queryResponse = await this.pineconeIndex.query({
        filter: { senderId: userId },
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches.map((match: any) => match.metadata);
    } catch (error) {
      console.error('Error querying user messages:', error);
      return [];
    }
  }
}

// Export singleton instance
export const messageIngestion = new MessageIngestionService();
