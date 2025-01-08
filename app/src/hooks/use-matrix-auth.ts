'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import {
  AuthDict,
  createClient,
  ILoginFlowsResponse,
  IRegisterRequestParams,
  IRequestTokenResponse,
  MatrixClient,
} from 'matrix-js-sdk';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MATRIX_SERVER_URL = process.env.NEXT_PUBLIC_MATRIX_SERVER_URL;

interface LoginOptions {
  initialDeviceDisplayName?: string;
  deviceId?: string;
}

interface PasswordResetTokenResponse {
  success: boolean;
  error?: string;
  sid?: string;
}

interface DeviceInfo {
  device_id: string;
  display_name?: string;
  last_seen_ip?: string;
  last_seen_ts?: number;
}

interface LoginFlows {
  flows: {
    type: string;
  }[];
  hasPasswordFlow: boolean;
  hasSsoFlow: boolean;
}

export function useMatrixAuth() {
  const { accessToken, userId, deviceId, setSession, clearSession } = useAuthStore();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const clientRef = useRef<MatrixClient | null>(null);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(async () => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT) {
        toast.info('Logged out due to inactivity');
        await clearSession();
      }
    }, INACTIVITY_TIMEOUT);
  }, [clearSession]);

  // Create Matrix client
  const createMatrixClient = useCallback((token?: string, id?: string) => {
    if (!MATRIX_SERVER_URL) throw new Error('Matrix server URL not configured');

    const client = createClient({
      baseUrl: MATRIX_SERVER_URL,
      accessToken: token,
      userId: id,
    });

    clientRef.current = client;
    return client;
  }, []);

  // Get available login flows
  const getLoginFlows = useCallback(async (): Promise<LoginFlows> => {
    try {
      const client = createMatrixClient();
      const response: ILoginFlowsResponse = await client.loginFlows();

      return {
        flows: response.flows,
        hasPasswordFlow: response.flows.some(flow => flow.type === 'm.login.password'),
        hasSsoFlow: response.flows.some(flow => flow.type === 'm.login.sso'),
      };
    } catch (error: any) {
      console.error('Get login flows error:', error);
      throw new Error(error.message || 'Failed to get login flows');
    }
  }, [createMatrixClient]);

  // Register new user
  const register = useCallback(
    async (
      username: string,
      password: string,
      email?: string,
      options?: {
        initialDeviceDisplayName?: string;
      }
    ) => {
      try {
        const client = createMatrixClient();

        // Initialize auth with proper type structure
        const auth: AuthDict = {
          type: 'm.login.dummy',
          session: undefined,
        };

        // Add email if provided
        if (email) {
          const clientSecret = Math.random().toString(36).substring(2);
          const response = await client.requestRegisterEmailToken(
            email,
            clientSecret,
            1,
            'Register'
          );

          const emailAuth: AuthDict = {
            type: 'm.login.email.identity',
            threepid_creds: {
              client_secret: clientSecret,
              sid: response.sid,
            },
            session: undefined,
          };

          Object.assign(auth, emailAuth);
        }

        const registerParams: IRegisterRequestParams = {
          auth,
          username,
          password,
          initial_device_display_name: options?.initialDeviceDisplayName || 'Web Client',
        };

        const response = await client.registerRequest(registerParams);

        if (response.access_token && response.user_id && response.device_id) {
          setSession(response.access_token, response.user_id, response.device_id);
          resetInactivityTimer();
          return { success: true };
        }

        return {
          success: false,
          error: 'Registration failed: No access token received',
        };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed',
        };
      }
    },
    [createMatrixClient, setSession, resetInactivityTimer]
  );

  // Login with password
  const login = useCallback(
    async (username: string, password: string, options?: LoginOptions) => {
      try {
        const client = createMatrixClient();
        const deviceId = options?.deviceId || `web_${Date.now()}`;

        const response = await client.login('m.login.password', {
          user: username,
          password,
          device_id: deviceId,
          initial_device_display_name: options?.initialDeviceDisplayName || 'Web Client',
        });

        setSession(response.access_token, response.user_id, response.device_id);
        resetInactivityTimer();
        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error.message || 'Login failed',
        };
      }
    },
    [createMatrixClient, setSession, resetInactivityTimer]
  );

  // Get SSO login URL
  const getSsoLoginUrl = useCallback(
    (redirectUrl: string) => {
      if (!MATRIX_SERVER_URL) throw new Error('Matrix server URL not configured');
      const client = createMatrixClient();
      return client.getSsoLoginUrl(redirectUrl, 'sso');
    },
    [createMatrixClient]
  );

  // Complete SSO login
  const completeSsoLogin = useCallback(
    (loginToken: string) => {
      return login('', '', { deviceId: `sso_${Date.now()}` });
    },
    [login]
  );

  // Logout
  const logout = useCallback(
    async (everywhere = false) => {
      try {
        if (accessToken) {
          const client = createMatrixClient(accessToken, userId || undefined);
          if (everywhere) {
            await client.logout(true); // Logout from all devices
          } else {
            await client.logout(); // Logout from current device only
          }
        }
        await clearSession();
        return { success: true };
      } catch (error: any) {
        console.error('Logout error:', error);
        return {
          success: false,
          error: error.message || 'Logout failed',
        };
      }
    },
    [accessToken, userId, createMatrixClient, clearSession]
  );

  // Request password reset token
  const requestPasswordResetToken = useCallback(
    async (email: string): Promise<PasswordResetTokenResponse> => {
      try {
        const client = createMatrixClient();
        const response: IRequestTokenResponse = await client.requestPasswordEmailToken(
          email,
          'Password Reset',
          1,
          'Password reset for your account'
        );

        return {
          success: true,
          sid: response.sid,
        };
      } catch (error: any) {
        console.error('Password reset token request error:', error);
        return {
          success: false,
          error: error.message || 'Failed to request password reset',
        };
      }
    },
    [createMatrixClient]
  );

  // Reset password with token
  const resetPassword = useCallback(
    async (newPassword: string, token: string) => {
      try {
        const client = createMatrixClient();
        await client.setPassword(
          {
            type: 'm.login.email.identity',
            threepid_creds: {
              sid: token,
              client_secret: Math.random().toString(36).substring(2),
            },
          },
          newPassword
        );

        return { success: true };
      } catch (error: any) {
        console.error('Password reset error:', error);
        return {
          success: false,
          error: error.message || 'Failed to reset password',
        };
      }
    },
    [createMatrixClient]
  );

  // Change password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        await client.setPassword(
          {
            type: 'm.login.password',
            identifier: {
              type: 'm.id.user',
              user: userId.split(':')[0].substring(1),
            },
            password: currentPassword,
          },
          newPassword
        );

        return { success: true };
      } catch (error: any) {
        console.error('Change password error:', error);
        return {
          success: false,
          error: error.message || 'Failed to change password',
        };
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Get logged in devices
  const getDevices = useCallback(async (): Promise<DeviceInfo[]> => {
    if (!accessToken || !userId) {
      throw new Error('Not authenticated');
    }

    try {
      const client = createMatrixClient(accessToken, userId);
      const response = await client.getDevices();
      return response.devices;
    } catch (error: any) {
      console.error('Get devices error:', error);
      throw new Error(error.message || 'Failed to get devices');
    }
  }, [accessToken, userId, createMatrixClient]);

  // Delete device
  const deleteDevice = useCallback(
    async (deviceId: string, password?: string) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        const auth: AuthDict = password
          ? {
              type: 'm.login.password',
              identifier: {
                type: 'm.id.user',
                user: userId.split(':')[0].substring(1),
              },
              password,
            }
          : { type: 'm.login.dummy' };

        await client.deleteDevice(deviceId, auth);
        return { success: true };
      } catch (error: any) {
        console.error('Delete device error:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete device',
        };
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Deactivate account
  const deactivateAccount = useCallback(
    async (password: string, eraseData = false) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        await client.deactivateAccount(
          {
            type: 'm.login.password',
            identifier: {
              type: 'm.id.user',
              user: userId.split(':')[0].substring(1),
            },
            password,
          } as AuthDict,
          eraseData
        );

        await clearSession();
        return { success: true };
      } catch (error: any) {
        console.error('Deactivate account error:', error);
        return {
          success: false,
          error: error.message || 'Failed to deactivate account',
        };
      }
    },
    [accessToken, userId, createMatrixClient, clearSession]
  );

  // Update device display name
  const updateDeviceDisplayName = useCallback(
    async (displayName: string) => {
      if (!accessToken || !userId || !deviceId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        await client.setDeviceDetails(deviceId, {
          display_name: displayName,
        });
        return { success: true };
      } catch (error: any) {
        console.error('Update device name error:', error);
        return {
          success: false,
          error: error.message || 'Failed to update device name',
        };
      }
    },
    [accessToken, userId, deviceId, createMatrixClient]
  );

  // Get account data
  const getAccountData = useCallback(
    async (type: string) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        return client.getAccountData(type);
      } catch (error: any) {
        console.error('Get account data error:', error);
        throw new Error(error.message || 'Failed to get account data');
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Set account data
  const setAccountData = useCallback(
    async (type: string, content: any) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        await client.setAccountData(type, content);
        return { success: true };
      } catch (error: any) {
        console.error('Set account data error:', error);
        return {
          success: false,
          error: error.message || 'Failed to set account data',
        };
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Get user presence
  const getUserPresence = useCallback(
    async (targetUserId: string = userId!) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        const presence = await client.getPresence(targetUserId);
        return presence;
      } catch (error: any) {
        console.error('Get presence error:', error);
        throw new Error(error.message || 'Failed to get user presence');
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Set user presence
  const setUserPresence = useCallback(
    async (presence: 'online' | 'offline' | 'unavailable', statusMsg?: string) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        await client.setPresence({
          presence,
          status_msg: statusMsg,
        });
        return { success: true };
      } catch (error: any) {
        console.error('Set presence error:', error);
        return {
          success: false,
          error: error.message || 'Failed to set user presence',
        };
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  // Track user activity
  useEffect(() => {
    if (!accessToken) return;

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Initial timer
    resetInactivityTimer();

    return () => {
      // Cleanup
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [accessToken, resetInactivityTimer]);

  // Request email verification
  const requestEmailVerification = useCallback(
    async (email: string) => {
      try {
        const client = createMatrixClient();
        const clientSecret = Math.random().toString(36).substring(2);
        const response = await client.requestEmailToken(
          email,
          clientSecret,
          1,
          'Email Verification'
        );

        return {
          success: true,
          sid: response.sid,
        };
      } catch (error: any) {
        console.error('Email verification request error:', error);
        return {
          success: false,
          error: error.message || 'Failed to request email verification',
        };
      }
    },
    [createMatrixClient]
  );

  // Verify email with token
  const verifyEmail = useCallback(
    async (token: string, sid: string) => {
      if (!accessToken || !userId) {
        throw new Error('Not authenticated');
      }

      try {
        const client = createMatrixClient(accessToken, userId);
        const clientSecret = Math.random().toString(36).substring(2);
        await client.submitMsisdnToken(token, sid, clientSecret, '1');

        return { success: true };
      } catch (error: any) {
        console.error('Email verification error:', error);
        return {
          success: false,
          error: error.message || 'Failed to verify email',
        };
      }
    },
    [accessToken, userId, createMatrixClient]
  );

  return {
    isAuthenticated: !!accessToken,
    userId,
    deviceId,
    getLoginFlows,
    register,
    login,
    getSsoLoginUrl,
    completeSsoLogin,
    logout,
    requestPasswordResetToken,
    resetPassword,
    changePassword,
    getDevices,
    deleteDevice,
    updateDeviceDisplayName,
    deactivateAccount,
    getAccountData,
    setAccountData,
    getUserPresence,
    setUserPresence,
    requestEmailVerification,
    verifyEmail,
  };
}
