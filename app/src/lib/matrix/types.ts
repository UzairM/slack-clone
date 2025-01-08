import type { MatrixClient } from 'matrix-js-sdk';

export interface MatrixContextType {
  client: MatrixClient | null;
  isInitialized: boolean;
  error: Error | null;
}

export interface MatrixProviderProps {
  children: React.ReactNode;
  homeserverUrl: string;
  accessToken?: string;
}
