'use client';

import { cn } from '@/lib/utils';

interface EmoteMessageProps {
  content: string;
  sender: string;
  className?: string;
}

export function EmoteMessage({ content, sender, className }: EmoteMessageProps) {
  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      * {sender} {content}
    </div>
  );
}
