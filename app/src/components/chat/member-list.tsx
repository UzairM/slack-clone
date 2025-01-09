'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMatrix } from '@/hooks/use-matrix';
import { cn } from '@/lib/utils';
import { RoomMember } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';

interface MemberListProps {
  roomId: string;
  className?: string;
}

export function MemberList({ roomId, className }: MemberListProps) {
  const { client } = useMatrix();
  const [members, setMembers] = useState<RoomMember[]>([]);

  useEffect(() => {
    if (!client || !roomId) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    // Get all joined members
    const getMembers = () => {
      const allMembers = room.getJoinedMembers();
      // Sort members by name
      allMembers.sort((a, b) => {
        const nameA = a.name || a.userId;
        const nameB = b.name || b.userId;
        return nameA.localeCompare(nameB);
      });
      setMembers(allMembers);
    };

    // Initial load
    getMembers();

    // Listen for membership changes
    const onMembership = () => {
      getMembers();
    };

    client.on('RoomMember.membership' as any, onMembership);

    return () => {
      client.removeListener('RoomMember.membership' as any, onMembership);
    };
  }, [client, roomId]);

  const getMemberAvatar = (member: RoomMember) => {
    if (!client) return null;

    // Try to get member's avatar from their profile
    const avatarUrl = member.getAvatarUrl(client.baseUrl, 96, 96, 'crop', false, false);
    if (avatarUrl) return avatarUrl;

    // Try to get avatar from member's Matrix ID
    const userId = member.userId;
    const userProfile = client.getUser(userId);
    if (userProfile) {
      const profileAvatarUrl = userProfile.avatarUrl;
      if (profileAvatarUrl) {
        return client.mxcUrlToHttp(profileAvatarUrl, 96, 96, 'crop');
      }
    }

    // Use Dicebear as fallback
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.userId)}`;
  };

  const getMemberDisplayName = (member: RoomMember) => {
    // Try room-specific display name first
    if (member.name) return member.name;

    // Try user's global display name
    const userId = member.userId;
    const userProfile = client?.getUser(userId);
    if (userProfile?.displayName) return userProfile.displayName;

    // Fall back to userId without server part
    return member.userId.slice(1).split(':')[0];
  };

  if (!client) return null;

  return (
    <ScrollArea className={cn('h-full px-4', className)}>
      <div className="space-y-4">
        <div className="text-sm font-medium">Members ({members.length})</div>
        <div className="space-y-2">
          {members.map(member => {
            const avatarUrl = getMemberAvatar(member);
            const displayName = getMemberDisplayName(member);
            const powerLevel = member.powerLevel || 0;

            return (
              <div key={member.userId} className="flex items-center gap-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">{member.userId}</div>
                </div>
                {powerLevel >= 100 && <div className="text-xs font-medium text-primary">Admin</div>}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
