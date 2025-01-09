'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  users: string[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  let message = '';
  if (users.length === 1) {
    message = `${users[0]} is typing`;
  } else if (users.length === 2) {
    message = `${users[0]} and ${users[1]} are typing`;
  } else {
    message = `${users[0]} and ${users.length - 1} others are typing`;
  }

  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground', className)}
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
