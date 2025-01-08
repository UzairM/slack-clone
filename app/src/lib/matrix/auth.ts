import { createClient } from 'matrix-js-sdk';
import { z } from 'zod';

const MATRIX_SERVER_URL = process.env.NEXT_PUBLIC_MATRIX_SERVER_URL || 'http://localhost:8008';

// Username validation rules
const usernameRegex = /^[a-z0-9._=\-/]+$/;
const reservedUsernames = ['admin', 'system', 'support', 'moderator', 'mod'];

// Password validation rules
const passwordMinLength = 8;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Additional validation rules
const commonPasswords = [
  'password',
  '123456',
  'qwerty',
  'letmein',
  'admin',
  'welcome',
  'monkey',
  'dragon',
];

const usernameReservedPrefixes = ['admin_', 'mod_', 'system_', 'support_'];
const usernameReservedSuffixes = ['_admin', '_mod', '_system', '_support'];

// Enhanced registration schema
export const registrationSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .max(255, 'Username is too long')
      .regex(
        usernameRegex,
        'Username can only contain lowercase letters, numbers, dots, equals signs, hyphens, and forward slashes'
      ),

    password: z.string().min(1, 'Password is required'),

    confirmPassword: z.string(),

    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),

    initialDeviceDisplayName: z
      .string()
      .max(100, 'Device name cannot exceed 100 characters')
      .optional()
      .transform(val => val || `Web Client (${new Date().toISOString()})`),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegistrationData = z.infer<typeof registrationSchema>;

// Registration response types
interface RegistrationSuccess {
  success: true;
  data: {
    access_token?: string;
    device_id: string;
    user_id: string;
    expires_in_ms?: number;
    refresh_token?: string;
  };
}

interface RegistrationAuthRequired {
  success: false;
  requiresAuth: true;
  flows: any[];
  session: string;
}

export interface RegistrationError {
  success: false;
  error: string;
  requiresAuth?: false;
}

export type RegistrationResponse =
  | RegistrationSuccess
  | RegistrationAuthRequired
  | RegistrationError;

// Schema for login data
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type LoginData = z.infer<typeof loginSchema>;

// Schema for requesting password reset
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetData = z.infer<typeof requestPasswordResetSchema>;

// Schema for resetting password
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Schema for changing password
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// Create a Matrix client instance
export const createMatrixClient = (accessToken?: string, userId?: string) => {
  const config: any = {
    baseUrl: MATRIX_SERVER_URL,
    accessToken,
  };

  if (userId) {
    config.userId = userId.startsWith('@') ? userId : `@${userId}`;
  }

  return createClient(config);
};

// Register a new user
export const registerUser = async (data: RegistrationData): Promise<RegistrationResponse> => {
  const client = createMatrixClient();
  const homeserver = MATRIX_SERVER_URL.replace(/^https?:\/\//, '');

  try {
    const response = await client.register(
      data.username,
      data.password,
      null, // Let Matrix generate device ID
      {
        type: 'm.login.dummy',
      }
    );

    if (!response.access_token || !response.user_id || !response.device_id) {
      throw new Error('Invalid registration response');
    }

    return {
      success: true,
      data: {
        access_token: response.access_token,
        device_id: response.device_id,
        user_id: response.user_id.startsWith('@')
          ? response.user_id
          : `@${response.user_id}:${homeserver}`,
      },
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Registration failed',
    };
  }
};

// Login user
export const loginUser = async (data: LoginData) => {
  const client = createMatrixClient();
  const deviceId = `web_${Date.now()}`;
  const homeserver = MATRIX_SERVER_URL.replace(/^https?:\/\//, '');

  try {
    const response = await client.login('m.login.password', {
      user: data.username,
      password: data.password,
      device_id: deviceId,
    });

    // Ensure user_id is properly formatted
    if (!response.user_id?.startsWith('@')) {
      response.user_id = `@${response.user_id}:${homeserver}`;
    }

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
};

// Logout user
export const logoutUser = async (accessToken: string) => {
  const client = createMatrixClient(accessToken);

  try {
    await client.logout();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Logout failed',
    };
  }
};

// Request password reset
export const requestPasswordReset = async (data: RequestPasswordResetData) => {
  const client = createMatrixClient();

  try {
    await client.requestPasswordEmailToken(
      data.email,
      'ChatGenius Password Reset',
      1 // Client defined ID
    );

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to request password reset',
    };
  }
};

// Reset password with token
export const resetPassword = async (data: ResetPasswordData) => {
  const client = createMatrixClient();

  try {
    await client.setPassword(
      {
        auth: {
          type: 'm.login.email.identity',
          threepid_creds: {
            sid: data.token,
            client_secret: 'password_reset_secret',
          },
        },
      },
      data.newPassword
    );

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    };
  }
};

// Change password
export const changePassword = async (
  accessToken: string,
  userId: string,
  data: ChangePasswordData
) => {
  const client = createMatrixClient(accessToken, userId);

  try {
    await client.setPassword(
      {
        type: 'm.login.password',
        identifier: {
          type: 'm.id.user',
          user: userId.split(':')[0].substring(1),
        },
        password: data.currentPassword,
      },
      data.newPassword
    );

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Failed to change password:', error);
    return {
      success: false,
      error: error.message || 'Failed to change password',
    };
  }
};
