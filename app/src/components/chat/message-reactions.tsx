'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
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

  const handleReactionClick = async (reaction: string) => {
    const hasReacted = reactions[reaction]?.userIds.includes(userId || '');
    if (hasReacted) {
      await onRemoveReaction(messageId, reaction);
    } else {
      await onAddReaction(messageId, reaction);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    await onAddReaction(messageId, emoji);
  };

  if (!reactions || Object.keys(reactions).length === 0) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-sm">😊</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-80">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>Add reaction</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
              <TooltipContent>{hasReacted ? 'Remove reaction' : 'Add reaction'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <span className="text-sm">😊</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>Add reaction</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
