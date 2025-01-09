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
    if (!client) return;

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

  if (!client) return null;

  return (
    <ScrollArea className={cn('h-full px-4', className)}>
      <div className="space-y-4">
        <div className="text-sm font-medium">Members ({members.length})</div>
        <div className="space-y-2">
          {members.map(member => {
            const avatarUrl =
              member.getAvatarUrl(client.baseUrl, 32, 32, 'crop', false, false) || '';
            return (
              <div key={member.userId} className="flex items-center gap-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>
                    {(member.name || member.userId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{member.name || member.userId}</div>
                  {member.name && (
                    <div className="text-xs text-muted-foreground truncate">{member.userId}</div>
                  )}
                </div>
                {member.powerLevel >= 100 && (
                  <div className="text-xs font-medium text-primary">Admin</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
