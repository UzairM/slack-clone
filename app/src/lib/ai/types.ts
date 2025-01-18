export interface PersonaConfig {
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
