'use client';

import type { MatrixContextType } from '@/lib/matrix/types';
import { useAuthStore } from '@/lib/store/auth-store';
import type { MatrixClient } from 'matrix-js-sdk';
import { createClient } from 'matrix-js-sdk';
import { createContext, useEffect, useState } from 'react';

export const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken, userId } = useAuthStore();

  useEffect(() => {
    const initMatrix = async () => {
      console.log('Initializing Matrix client:', {
        hasAccessToken: !!accessToken,
        hasUserId: !!userId,
        hasServerUrl: !!process.env.NEXT_PUBLIC_MATRIX_SERVER_URL,
      });

      if (!accessToken || !userId || !process.env.NEXT_PUBLIC_MATRIX_SERVER_URL) {
        console.warn('Missing required Matrix credentials:', {
          accessToken: !!accessToken,
          userId: !!userId,
          serverUrl: !!process.env.NEXT_PUBLIC_MATRIX_SERVER_URL,
        });
        setIsInitialized(true);
        return;
      }

      try {
        console.log('Creating Matrix client...');
        const matrixClient = createClient({
          baseUrl: process.env.NEXT_PUBLIC_MATRIX_SERVER_URL,
          accessToken,
          userId,
        });

        console.log('Starting Matrix client...');
        await matrixClient.startClient({ initialSyncLimit: 10 });
        console.log('Matrix client started successfully');

        setClient(matrixClient);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Matrix client:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize Matrix client'));
        setIsInitialized(true);
      }
    };

    initMatrix();

    return () => {
      if (client) {
        console.log('Stopping Matrix client...');
        client.stopClient();
      }
    };
  }, [accessToken, userId]);

  // Log state changes
  useEffect(() => {
    console.log('Matrix client state updated:', {
      hasClient: !!client,
      isInitialized,
      hasError: !!error,
    });
  }, [client, isInitialized, error]);

  return (
    <MatrixContext.Provider value={{ client, isInitialized, error }}>
      {children}
    </MatrixContext.Provider>
  );
}
