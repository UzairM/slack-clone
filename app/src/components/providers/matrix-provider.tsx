'use client';

import { createMatrixClient } from '@/lib/matrix/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { ClientEvent, MatrixClient } from 'matrix-js-sdk';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MatrixContextType {
  client: MatrixClient | null;
  isInitialized: boolean;
  error: string | null;
}

const MatrixContext = createContext<MatrixContextType>({
  client: null,
  isInitialized: false,
  error: null,
});

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, userId, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initializeClient = async () => {
      if (!accessToken || !userId || !isAuthenticated) {
        setClient(null);
        setIsInitialized(false);
        setError(null);
        return;
      }

      try {
        // Create Matrix client with user ID
        const matrixClient = createMatrixClient(accessToken, userId);

        // Start the client
        await matrixClient.startClient({
          initialSyncLimit: 20, // Limit initial sync to improve performance
        });

        // Wait for first sync
        await new Promise<void>((resolve, reject) => {
          const onSync = (state: string) => {
            if (state === 'PREPARED') {
              matrixClient.removeListener(ClientEvent.Sync, onSync);
              resolve();
            } else if (state === 'ERROR') {
              matrixClient.removeListener(ClientEvent.Sync, onSync);
              reject(new Error('Sync failed'));
            }
          };

          matrixClient.once(ClientEvent.Sync, onSync);
        });

        if (mounted) {
          setClient(matrixClient);
          setIsInitialized(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('Failed to initialize Matrix client:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize Matrix client');
          toast.error('Failed to connect to chat server');
        }
      }
    };

    initializeClient();

    return () => {
      mounted = false;
      if (client) {
        client.stopClient();
        setClient(null);
        setIsInitialized(false);
      }
    };
  }, [accessToken, userId, isAuthenticated]);

  return (
    <MatrixContext.Provider
      value={{
        client,
        isInitialized,
        error,
      }}
    >
      {children}
    </MatrixContext.Provider>
  );
}

export function useMatrix() {
  const context = useContext(MatrixContext);
  if (!context) {
    throw new Error('useMatrix must be used within a MatrixProvider');
  }
  return context;
}
