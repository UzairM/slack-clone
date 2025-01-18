import { messageIngestion } from './message-ingestion';
import { personaManager } from './persona-manager';

interface ChatMessage {
  sender: 'human1' | 'human2';
  content: string;
  timestamp: number;
}

interface PersonaMapping {
  human1: {
    userId: string;
    displayName: string;
    personality?: string;
    tone?: string;
    interests?: string[];
    responseStyle?: string;
  };
  human2: {
    userId: string;
    displayName: string;
    personality?: string;
    tone?: string;
    interests?: string[];
    responseStyle?: string;
  };
}

export async function seedPersonasFromConversation(
  conversation: ChatMessage[],
  mapping: PersonaMapping,
  roomId: string
) {
  try {
    // Register personas if they don't exist
    for (const human of ['human1', 'human2'] as const) {
      const personaConfig = mapping[human];
      const existingPersona = await personaManager.getPersona(personaConfig.userId);

      if (!existingPersona) {
        await personaManager.registerPersona({
          userId: personaConfig.userId,
          displayName: personaConfig.displayName,
          personality: personaConfig.personality || 'natural and authentic',
          tone: personaConfig.tone || 'conversational',
          interests: personaConfig.interests || [],
          responseStyle: personaConfig.responseStyle || 'natural',
        });
      }
    }

    // Ingest conversation messages
    for (const message of conversation) {
      const personaConfig = mapping[message.sender];

      await messageIngestion.ingestMessage({
        messageId: `seed-${message.timestamp}-${Math.random().toString(36).substring(7)}`,
        roomId: roomId,
        senderId: personaConfig.userId,
        userId: personaConfig.userId, // Important: This links the message to the persona
        content: message.content,
        timestamp: message.timestamp,
        type: 'text',
      });
    }

    console.log('Successfully seeded personas and conversation');
  } catch (error) {
    console.error('Error seeding personas and conversation:', error);
    throw error;
  }
}

// Example usage:
/*
const conversation: ChatMessage[] = [
  {
    sender: 'human1',
    content: "Hey, how's your day going?",
    timestamp: 1710000000000
  },
  {
    sender: 'human2',
    content: "Pretty good! Just finished that project we discussed.",
    timestamp: 1710000060000
  }
];

const mapping: PersonaMapping = {
  human1: {
    userId: '@john:localhost',
    displayName: 'John',
    personality: 'friendly and casual',
    tone: 'informal',
    interests: ['technology', 'gaming'],
    responseStyle: 'enthusiastic'
  },
  human2: {
    userId: '@sarah:localhost',
    displayName: 'Sarah',
    personality: 'professional and focused',
    tone: 'polite',
    interests: ['project management', 'productivity'],
    responseStyle: 'concise'
  }
};

await seedPersonasFromConversation(conversation, mapping, '!room123:localhost');
*/
