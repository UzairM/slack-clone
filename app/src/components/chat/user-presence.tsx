'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { cn } from '@/lib/utils';
import { MatrixEvent } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';

interface UserPresenceProps {
  userId: string;
  className?: string;
}

interface PresenceInfo {
  presence: 'online' | 'offline' | 'unavailable';
  status_msg?: string;
  last_active_ago?: number;
  currently_active?: boolean;
  user_id?: string;
}

export function UserPresence({ userId, className }: UserPresenceProps) {
  const { client } = useMatrix();
  const { getUserPresence } = useMatrixAuth();
  const [presence, setPresence] = useState<PresenceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format userId to ensure it has both @ prefix and domain
  const formattedUserId = userId.includes(':')
    ? userId.startsWith('@')
      ? userId
      : `@${userId}`
    : userId.startsWith('@')
      ? `${userId}:matrix.org`
      : `@${userId}:matrix.org`;

  useEffect(() => {
    const loadPresence = async () => {
      try {
        const presenceData = await getUserPresence(formattedUserId);
        setPresence(presenceData);
      } catch (err: any) {
        console.error('Failed to load presence:', err);
        setError(err.message || 'Failed to load presence');
      }
    };

    // Initial load
    loadPresence();

    if (!client) return;

    // Listen for presence events
    const onPresence = (event: MatrixEvent) => {
      const userId = event.getType() === 'm.presence' ? event.getSender() : null;
      if (userId === formattedUserId) {
        const content = event.getContent();
        setPresence({
          presence: content.presence,
          status_msg: content.status_msg,
          last_active_ago: content.last_active_ago,
          currently_active: content.currently_active,
          user_id: userId,
        });
      }
    };

    // Listen for both global presence events and specific user presence
    client.on('Event.decrypted' as any, onPresence);
    client.on('event' as any, onPresence);

    // Start listening for presence events for this user
    client.getPresence(formattedUserId).catch(console.error);

    return () => {
      client.removeListener('Event.decrypted' as any, onPresence);
      client.removeListener('event' as any, onPresence);
    };
  }, [client, getUserPresence, formattedUserId]);

  if (error || !presence) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          presence.presence === 'online' && 'bg-green-500',
          presence.presence === 'unavailable' && 'bg-yellow-500',
          presence.presence === 'offline' && 'bg-gray-500'
        )}
      />
      {presence.status_msg && (
        <span className="text-sm text-muted-foreground">{presence.status_msg}</span>
      )}
    </div>
  );
}
