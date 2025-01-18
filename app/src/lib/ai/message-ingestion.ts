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
  userId?: string;
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
    if (!this.pineconeIndex || !this.embeddings) {
      await this.initialize();
      if (!this.pineconeIndex || !this.embeddings) {
        throw new Error('Failed to initialize message ingestion service');
      }
    }

    try {
      const embedding = await this.embeddings.embedQuery(metadata.content);

      await this.pineconeIndex.upsert({
        vectors: [
          {
            id: metadata.messageId,
            values: embedding,
            metadata: {
              ...metadata,
              text: metadata.content,
            },
          },
        ],
      });

      console.log('Message ingested successfully:', metadata.messageId);
    } catch (error) {
      console.error('Error ingesting message:', error);
      throw error;
    }
  }

  async queryUserMessages(userId: string, limit: number = 5): Promise<MessageMetadata[]> {
    if (!this.pineconeIndex || !this.embeddings) {
      await this.initialize();
      if (!this.pineconeIndex || !this.embeddings) {
        throw new Error('Failed to initialize message ingestion service');
      }
    }

    try {
      // Create a dummy vector for metadata-only query
      const dummyVector = await this.embeddings.embedQuery('');

      const response = await this.pineconeIndex.query({
        vector: dummyVector,
        topK: limit,
        filter: {
          senderId: userId,
        },
        includeMetadata: true,
      });

      return response.matches
        .filter((match: any) => match.metadata)
        .map((match: any) => ({
          messageId: match.metadata.messageId,
          roomId: match.metadata.roomId,
          senderId: match.metadata.senderId,
          content: match.metadata.content,
          timestamp: match.metadata.timestamp,
          type: match.metadata.type,
          threadId: match.metadata.threadId,
          replyTo: match.metadata.replyTo,
          userId: match.metadata.userId,
        }))
        .sort((a: MessageMetadata, b: MessageMetadata) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error querying user messages:', error);
      throw error;
    }
  }

  async queryRelevantUserMessages(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<MessageMetadata[]> {
    if (!this.pineconeIndex || !this.embeddings) {
      await this.initialize();
      if (!this.pineconeIndex || !this.embeddings) {
        throw new Error('Failed to initialize message ingestion service');
      }
    }

    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);

      const response = await this.pineconeIndex.query({
        vector: queryEmbedding,
        topK: limit,
        filter: {
          $or: [
            { userId: userId }, // Messages from the bot
            { senderId: userId }, // Messages to the bot
          ],
        },
        includeMetadata: true,
      });

      return response.matches
        .filter((match: any) => match.metadata)
        .map((match: any) => ({
          messageId: match.metadata.messageId,
          roomId: match.metadata.roomId,
          senderId: match.metadata.senderId,
          content: match.metadata.content,
          timestamp: match.metadata.timestamp,
          type: match.metadata.type,
          threadId: match.metadata.threadId,
          replyTo: match.metadata.replyTo,
          userId: match.metadata.userId,
          similarity: match.score,
        }))
        .sort((a: MessageMetadata, b: MessageMetadata) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error querying relevant user messages:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageIngestion = new MessageIngestionService();
