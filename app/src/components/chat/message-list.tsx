'use client';

import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useChannelStore } from '@/lib/store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import { Message as MessageComponent } from './message';

interface MessageListProps {
  roomId: string;
  className?: string;
}

const ESTIMATED_MESSAGE_HEIGHT = 76;

export function MessageList({ roomId, className }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { activeChannel } = useChannelStore();
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    hasMore,
    isLoading,
    addReaction,
    removeReaction,
  } = useMatrixMessages(roomId);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    overscan: 5,
  });

  // Handle reactions
  const handleReaction = async (messageId: string, reaction: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      // If the reaction already exists, remove it
      if (message.reactions?.[reaction]) {
        await removeReaction(messageId, reaction);
      } else {
        // Otherwise, add it
        await addReaction(messageId, reaction);
      }
      setReactionTarget(null);
    } catch (error) {
      console.error('Failed to handle reaction:', error);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Handle scroll to load more messages
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const firstMessage = document.querySelector('[data-index="0"]');
    if (firstMessage) {
      observer.observe(firstMessage);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div ref={parentRef} className={`relative h-full overflow-auto ${className ?? ''}`}>
      {isLoading && messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualItem => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={message.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MessageComponent
                  message={message}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReply={messageId => {
                    // TODO: Implement reply functionality
                    console.log('Reply to message:', messageId);
                  }}
                  onReaction={async (messageId, reaction) => {
                    if (reaction) {
                      await handleReaction(messageId, reaction);
                    } else {
                      setReactionTarget(messageId);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Emoji Picker */}
      {reactionTarget && (
        <div className="absolute bottom-0 right-0 p-4">
          <EmojiPicker
            onEmojiSelect={(emoji: string) => handleReaction(reactionTarget, emoji)}
            onClose={() => setReactionTarget(null)}
          />
        </div>
      )}
    </div>
  );
}
