'use client';

import { createClient } from '@/lib/matrix/sdk';
import type { MatrixContextType } from '@/lib/matrix/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { createContext, useEffect, useState } from 'react';

export const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MatrixContextType['client']>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken, userId } = useAuthStore();

  useEffect(() => {
    const initMatrix = async () => {
      if (!accessToken || !userId || !process.env.NEXT_PUBLIC_MATRIX_SERVER_URL) {
        setIsInitialized(true);
        return;
      }

      try {
        const matrixClient = createClient({
          baseUrl: process.env.NEXT_PUBLIC_MATRIX_SERVER_URL,
          accessToken,
          userId,
        });

        await matrixClient.startClient({ initialSyncLimit: 10 });

        setClient(matrixClient);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize Matrix client'));
        setIsInitialized(true);
      }
    };

    initMatrix();

    return () => {
      if (client) {
        client.stopClient();
      }
    };
  }, [accessToken, userId]);

  return (
    <MatrixContext.Provider value={{ client, isInitialized, error }}>
      {children}
    </MatrixContext.Provider>
  );
}
