import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { messageIngestion, MessageMetadata } from './message-ingestion';

interface PersonaConfig {
  userId: string;
  displayName: string;
  personality?: string;
  tone?: string;
  interests?: string[];
  responseStyle?: string;
  activeHours?: {
    start: number;
    end: number;
  };
}

export class PersonaManager {
  private chatModel: ChatOpenAI;
  private personas: Map<string, PersonaConfig> = new Map();

  constructor() {
    this.chatModel = new ChatOpenAI({
      modelName: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    });
  }

  registerPersona(config: PersonaConfig) {
    this.personas.set(config.userId, config);
  }

  unregisterPersona(userId: string) {
    this.personas.delete(userId);
  }

  getPersona(userId: string): PersonaConfig | undefined {
    return this.personas.get(userId);
  }

  async shouldRespondForUser(userId: string): Promise<boolean> {
    const persona = this.personas.get(userId);
    if (!persona) return false;

    // Check if within active hours
    if (persona.activeHours) {
      const currentHour = new Date().getHours();
      if (currentHour < persona.activeHours.start || currentHour >= persona.activeHours.end) {
        return true;
      }
    }

    return false;
  }

  async generateResponse(
    userId: string,
    messageContent: string,
    roomContext: string
  ): Promise<string> {
    const persona = this.personas.get(userId);
    if (!persona) throw new Error('Persona not found');

    // Get user's past messages for context
    const userMessages = await messageIngestion.queryUserMessages(userId, 5);
    const messageHistory = userMessages.map((msg: MessageMetadata) => `${msg.content}`).join('\n');

    // Create the prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are acting as an AI assistant for ${persona.displayName}.
      Personality: ${persona.personality || 'friendly and helpful'}
      Tone: ${persona.tone || 'casual and approachable'}
      Interests: ${persona.interests?.join(', ') || 'various topics'}
      Response Style: ${persona.responseStyle || 'concise and clear'}

      Recent message history from ${persona.displayName}:
      ${messageHistory}

      Current room context:
      ${roomContext}

      Incoming message:
      ${messageContent}

      Generate a response that matches ${persona.displayName}'s communication style and personality.
      Keep the response natural and conversational, as if ${persona.displayName} themselves were responding.
    `);

    // Create and execute the chain
    const chain = RunnableSequence.from([promptTemplate, this.chatModel, new StringOutputParser()]);

    const response = await chain.invoke({});
    return response;
  }
}

// Export singleton instance
export const personaManager = new PersonaManager();
