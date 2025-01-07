'use client';

import { useChannelStore } from '@/lib/store';
import { type Channel } from '@/lib/store/channel-store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  sender: Channel['members'][0];
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  channelId: string;
  className?: string;
}

const ESTIMATED_MESSAGE_HEIGHT = 76;

export function MessageList({ messages, channelId, className }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { activeChannel } = useChannelStore();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    overscan: 5,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      ref={parentRef}
      className={`relative h-full overflow-auto ${className ?? ''}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
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
              <div className="px-4 py-2 hover:bg-accent/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10">
                    {/* Avatar placeholder */}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.sender.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
