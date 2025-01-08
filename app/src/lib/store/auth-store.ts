import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import { createMatrixClient, logoutUser } from '../matrix/auth';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setSession: (accessToken: string, userId: string, deviceId: string) => void;
  clearSession: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

type PersistedState = Pick<AuthState, 'accessToken' | 'userId' | 'deviceId' | 'isAuthenticated'>;

// Custom storage adapter for cookies
const cookieStorage: PersistStorage<PersistedState> = {
  getItem: async (name): Promise<StorageValue<PersistedState> | null> => {
    try {
      const cookie = Cookies.get(name);
      if (!cookie) return null;
      return JSON.parse(cookie);
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  },
  setItem: (name, value): void => {
    try {
      Cookies.set(name, JSON.stringify(value), {
        expires: 30, // 30 days
        sameSite: 'lax',
        path: '/',
      });
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  },
  removeItem: (name): void => {
    try {
      Cookies.remove(name, { path: '/' });
    } catch (error) {
      console.error('Error removing cookie:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      userId: null,
      deviceId: null,
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,
      setSession: (accessToken: string, userId: string, deviceId: string) => {
        console.log('Setting session:', { accessToken, userId, deviceId });
        set({
          accessToken,
          userId,
          deviceId,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      clearSession: async () => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          await logoutUser(accessToken);
        }
        set({
          accessToken: null,
          userId: null,
          deviceId: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      setHydrated: (hydrated: boolean) =>
        set({
          isHydrated: hydrated,
          isLoading: !hydrated,
        }),
    }),
    {
      name: 'auth-storage',
      storage: cookieStorage,
      partialize: state => ({
        accessToken: state.accessToken,
        userId: state.userId,
        deviceId: state.deviceId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        console.log('Rehydrated state:', state);
        state?.setHydrated(true);
      },
    }
  )
);

// Create a Matrix client with the current session
export const getMatrixClient = () => {
  const { accessToken } = useAuthStore.getState();
  return createMatrixClient(accessToken || undefined);
};
