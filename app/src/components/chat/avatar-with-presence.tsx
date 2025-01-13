'use client';

import { UserPresence } from '@/components/chat/user-presence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarWithPresenceProps {
  userId: string;
  avatarUrl?: string;
  displayName?: string;
  className?: string;
  showPresence?: boolean;
}

export function AvatarWithPresence({
  userId,
  avatarUrl,
  displayName,
  className,
  showPresence = true,
}: AvatarWithPresenceProps) {
  return (
    <div className={cn('relative', className)}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {displayName ? displayName[0].toUpperCase() : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      {showPresence && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <UserPresence userId={userId} />
        </div>
      )}
    </div>
  );
}
