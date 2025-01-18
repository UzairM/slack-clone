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
  private personas: Map<string, PersonaConfig> = new Map();

  async getPersona(userId: string): Promise<PersonaConfig | null> {
    try {
      const persona = this.personas.get(userId);
      if (!persona) return null;
      return persona;
    } catch (error) {
      console.error('Error fetching persona:', error);
      return null;
    }
  }

  async registerPersona(config: PersonaConfig): Promise<void> {
    try {
      this.personas.set(config.userId, config);
      console.log('Successfully registered/updated persona for user:', config.userId);
    } catch (error) {
      console.error('Error registering persona:', error);
      throw error;
    }
  }
}

export const personaManager = new PersonaManager();
