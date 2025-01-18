import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

interface PersonaConfig {
  userId: string;
  displayName?: string;
  personality?: string;
  tone?: string;
  interests: string[];
  responseStyle?: string;
  activeHoursStart?: number | null;
  activeHoursEnd?: number | null;
}

class PersonaManager {
  async getPersona(userId: string): Promise<PersonaConfig | null> {
    try {
      const persona = await prisma.persona.findUnique({
        where: { userId },
      });

      if (!persona) return null;

      return {
        userId: persona.userId,
        displayName: persona.displayName || undefined,
        personality: persona.personality || undefined,
        tone: persona.tone || undefined,
        interests: persona.interests,
        responseStyle: persona.responseStyle || undefined,
        activeHoursStart: persona.activeHoursStart,
        activeHoursEnd: persona.activeHoursEnd,
      };
    } catch (error) {
      console.error('Error fetching persona:', error);
      return null;
    }
  }

  async registerPersona(config: PersonaConfig): Promise<void> {
    try {
      const data: Prisma.PersonaUncheckedCreateInput = {
        userId: config.userId,
        displayName: config.displayName || '',
        personality: config.personality || '',
        tone: config.tone || '',
        interests: config.interests,
        responseStyle: config.responseStyle || '',
        activeHoursStart: config.activeHoursStart,
        activeHoursEnd: config.activeHoursEnd,
      };

      await prisma.persona.upsert({
        where: { userId: config.userId },
        update: data,
        create: data,
      });
      console.log('Successfully registered/updated persona for user:', config.userId);
    } catch (error) {
      console.error('Error registering persona:', error);
      throw error;
    }
  }
}

export const personaManager = new PersonaManager();
