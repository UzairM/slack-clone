'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { cn } from '@/lib/utils';
import { ClientEvent, MatrixEvent } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';

interface UserPresenceProps {
  userId: string;
  className?: string;
}

type PresenceState = 'online' | 'offline' | 'unavailable';

interface PresenceInfo {
  presence: PresenceState;
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
  // Only format if it's not already a valid Matrix ID
  const formattedUserId = (() => {
    // If it starts with ! it's likely a room ID - invalid for presence
    if (userId.startsWith('!')) return null;

    // If it's already a valid Matrix ID (@user:domain), use it as is
    if (userId.match(/^@[^:]+:[^:]+$/)) return userId;

    // If it has a domain but no @, add @
    if (userId.includes(':')) return userId.startsWith('@') ? userId : `@${userId}`;

    // If it starts with @ but no domain, add domain
    if (userId.startsWith('@')) return `${userId}:matrix.org`;

    // Otherwise, add both @ and domain
    return `@${userId}:matrix.org`;
  })();

  useEffect(() => {
    if (!client || !formattedUserId) return;

    let isMounted = true;

    // Initial presence load
    const loadInitialPresence = async () => {
      try {
        const presenceData = await getUserPresence(formattedUserId);
        if (!isMounted) return;

        if (presenceData) {
          setPresence(presenceData);
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;

        // Handle specific error cases
        if (err.errcode === 'M_FORBIDDEN') {
          // User's presence is not visible - show offline state
          setPresence({
            presence: 'offline',
            user_id: formattedUserId,
          });
          return;
        }

        console.error('Failed to load initial presence:', err);
        setError(err.message || 'Failed to load presence');
      }
    };

    loadInitialPresence();

    // Handle presence events
    const handlePresence = (event: MatrixEvent, _state: any) => {
      if (!isMounted) return;

      // Only process events for our target user
      if (event.getSender() !== formattedUserId) return;

      const content = event.getContent();
      setPresence({
        presence: content.presence as PresenceState,
        status_msg: content.status_msg,
        last_active_ago: content.last_active_ago,
        currently_active: content.currently_active,
        user_id: event.getSender() || undefined,
      });
    };

    // Handle global presence sync
    const handlePresenceSync = (_state: any) => {
      if (!isMounted) return;

      const user = client.getUser(formattedUserId);
      if (user) {
        const presenceState = user.presence;
        if (presenceState) {
          setPresence({
            presence: presenceState as PresenceState,
            status_msg: user.presenceStatusMsg,
            last_active_ago: user.lastActiveAgo,
            currently_active: user.currentlyActive,
            user_id: formattedUserId,
          });
        }
      }
    };

    // Listen for presence events
    client.on('presence' as any, handlePresence);
    client.on(ClientEvent.Sync, handlePresenceSync);

    // Start listening for presence events for this user
    client.getPresence(formattedUserId).catch(err => {
      if (!isMounted) return;

      // Handle specific error cases
      if (err.errcode === 'M_FORBIDDEN') {
        // User's presence is not visible - show offline state
        setPresence({
          presence: 'offline',
          user_id: formattedUserId,
        });
        return;
      }

      console.error('Failed to get presence:', err);
    });

    return () => {
      isMounted = false;
      client.removeListener('presence' as any, handlePresence);
      client.removeListener(ClientEvent.Sync, handlePresenceSync);
    };
  }, [client, getUserPresence, formattedUserId]);

  // If we can't determine a valid user ID, or there's an error, show offline state
  if (!formattedUserId || error) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('h-2 w-2 rounded-full bg-gray-500')} />
      </div>
    );
  }

  // If we're still loading or have no presence data, show offline state
  if (!presence) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('h-2 w-2 rounded-full bg-gray-500')} />
      </div>
    );
  }

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
