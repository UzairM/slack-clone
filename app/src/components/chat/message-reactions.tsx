'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import React from 'react';
import { EmojiPicker } from '../ui/emoji-picker';

interface MessageReactionsProps {
  messageId: string;
  reactions: {
    [key: string]: {
      count: number;
      userIds: string[];
    };
  };
  onAddReaction: (messageId: string, reaction: string) => Promise<void>;
  onRemoveReaction: (messageId: string, reaction: string) => Promise<void>;
  className?: string;
}

export function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  className,
}: MessageReactionsProps) {
  const { userId } = useAuthStore();

  console.log('MessageReactions render:', {
    messageId,
    reactions,
    userId,
    hasReactions: Object.keys(reactions || {}).length > 0,
  });

  const handleReactionClick = async (reaction: string) => {
    const hasReacted = reactions[reaction]?.userIds.includes(userId || '');
    console.log('Reaction click:', {
      reaction,
      hasReacted,
      userIds: reactions[reaction]?.userIds,
      userId,
    });

    if (hasReacted) {
      await onRemoveReaction(messageId, reaction);
    } else {
      await onAddReaction(messageId, reaction);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    console.log('Emoji selected:', {
      emoji,
      messageId,
    });
    await onAddReaction(messageId, emoji);
  };

  const ReactionButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
  >((props, ref) => (
    <TooltipProvider>
      <Tooltip>
        <Popover>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button ref={ref} variant="ghost" size="icon" className="h-6 w-6" {...props}>
                <Smile className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>Add reaction</TooltipContent>
          <PopoverContent side="top" align="start" className="w-80 p-0">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  ));
  ReactionButton.displayName = 'ReactionButton';

  if (!reactions || Object.keys(reactions).length === 0) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <ReactionButton />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {Object.entries(reactions).map(([reaction, { count, userIds }]) => {
        const hasReacted = userIds.includes(userId || '');
        return (
          <TooltipProvider key={reaction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasReacted ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={() => handleReactionClick(reaction)}
                >
                  <span>{reaction}</span>
                  <span className="text-muted-foreground">{count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-medium">Reacted by:</div>
                  {userIds.map((id, index) => (
                    <div key={id} className="text-xs">
                      {id.slice(1).split(':')[0]}
                      {index < userIds.length - 1 && ','}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      <ReactionButton />
    </div>
  );
}
