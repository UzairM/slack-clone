import { z } from 'zod';
import { useAuthStore } from '../store/auth-store';
import { createMatrixClient } from './auth';

// Schema for session data
export const sessionSchema = z.object({
  accessToken: z.string(),
  deviceId: z.string(),
  userId: z.string(),
  expiresAt: z.number().optional(),
});

export type SessionData = z.infer<typeof sessionSchema>;

// Check if session is expired
export const isSessionExpired = (expiresAt?: number): boolean => {
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
};

// Refresh session
export const refreshSession = async (currentSession: SessionData): Promise<SessionData | null> => {
  try {
    const client = createMatrixClient(currentSession.accessToken);

    // Matrix doesn't support token refresh directly, so we'll re-login
    const response = await client.loginWithToken(currentSession.accessToken);

    if (response && response.access_token) {
      return {
        accessToken: response.access_token,
        deviceId: response.device_id,
        userId: response.user_id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }
};

// Get current device info
export const getCurrentDevice = async (accessToken: string) => {
  try {
    const client = createMatrixClient(accessToken);
    const devices = await client.getDevices();
    const currentDeviceId = client.getDeviceId();

    return devices.devices.find(device => device.device_id === currentDeviceId);
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
};

// Verify current device
export const verifyCurrentDevice = async (accessToken: string) => {
  try {
    const client = createMatrixClient(accessToken);
    const deviceId = client.getDeviceId();
    const userId = client.getUserId();

    if (!deviceId || !userId) return false;

    // Mark device as verified in crypto store
    await client.setDeviceVerified(userId, deviceId, true);
    return true;
  } catch (error) {
    console.error('Failed to verify device:', error);
    return false;
  }
};

// Session management hook
export const useSession = () => {
  const { accessToken, userId, isAuthenticated, setSession, clearSession } = useAuthStore();

  const validateSession = async () => {
    if (!accessToken || !userId) return false;

    const currentSession: SessionData = {
      accessToken,
      deviceId: '', // Will be set by Matrix client
      userId,
    };

    // Check if session needs refresh
    if (isSessionExpired(currentSession.expiresAt)) {
      const refreshedSession = await refreshSession(currentSession);
      if (refreshedSession) {
        setSession(
          refreshedSession.accessToken,
          refreshedSession.userId,
          refreshedSession.deviceId
        );
        return true;
      }
      await clearSession();
      return false;
    }

    return true;
  };

  return {
    isAuthenticated,
    userId,
    validateSession,
    getCurrentDevice: accessToken ? () => getCurrentDevice(accessToken) : null,
    verifyDevice: accessToken ? () => verifyCurrentDevice(accessToken) : null,
  };
};
