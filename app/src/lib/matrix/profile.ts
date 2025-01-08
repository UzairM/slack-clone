import { z } from 'zod';
import { createMatrixClient } from './auth';

// Schema for profile data
export const profileSchema = z.object({
  displayName: z.string().min(3).max(50),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  email: z.string().email().optional(),
  status: z.enum(['online', 'offline', 'unavailable']),
  customStatus: z.string().max(100).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

// Get user profile
export const getUserProfile = async (accessToken: string, userId: string) => {
  const formattedUserId = userId.startsWith('@') ? userId : `@${userId}`;
  const client = createMatrixClient(accessToken, formattedUserId);

  try {
    // Get profile info
    const [displayName, avatarUrl] = await Promise.all([
      client.getProfileInfo(formattedUserId, 'displayname'),
      client.getProfileInfo(formattedUserId, 'avatar_url'),
    ]);

    // Get presence info
    const presence = await client.getPresence(formattedUserId);

    // Construct profile data
    const profile: Partial<ProfileData> = {
      displayName: displayName?.displayname,
      avatarUrl: avatarUrl?.avatar_url,
      status: (presence?.presence || 'offline') as ProfileData['status'],
      customStatus: presence?.status_msg,
    };

    return {
      success: true,
      data: profile,
    };
  } catch (error: any) {
    console.error('Failed to get profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to get profile',
    };
  }
};

// Update user profile
export const updateUserProfile = async (
  accessToken: string,
  userId: string,
  data: Partial<ProfileData>
) => {
  const formattedUserId = userId.startsWith('@') ? userId : `@${userId}`;
  const client = createMatrixClient(accessToken, formattedUserId);

  try {
    // Update profile info
    const updates: Promise<any>[] = [];

    if (data.displayName) {
      updates.push(client.setDisplayName(data.displayName));
    }

    if (data.avatarUrl) {
      updates.push(client.setAvatarUrl(data.avatarUrl));
    }

    // Update presence info
    if (data.status || data.customStatus) {
      updates.push(
        client.setPresence({
          presence: data.status || 'online',
          status_msg: data.customStatus,
        })
      );
    }

    await Promise.all(updates);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
};

// Upload avatar image
export const uploadAvatar = async (accessToken: string, userId: string, file: File) => {
  const formattedUserId = userId.startsWith('@') ? userId : `@${userId}`;
  const client = createMatrixClient(accessToken, formattedUserId);

  try {
    // Upload file to Matrix media repository
    const response = await client.uploadContent(file, {
      type: file.type,
      name: file.name,
    });

    return {
      success: true,
      data: {
        url: response.content_uri,
      },
    };
  } catch (error: any) {
    console.error('Failed to upload avatar:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload avatar',
    };
  }
};
