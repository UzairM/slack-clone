'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Message } from './message';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
  roomId: string;
  className?: string;
}

export function MessageList({ roomId, className }: MessageListProps) {
  const { userId } = useAuthStore();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading: _isLoading,
    error: _error,
    hasMore: _hasMore,
    loadMore: _loadMore,
    sendMessage: _sendMessage,
    editMessage,
    deleteMessage,
    typingUsers,
  } = useMatrixMessages(roomId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll for loading more messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && _hasMore && !_isLoading) {
        _loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [_hasMore, _isLoading, _loadMore]);

  // Return early if no userId
  if (!userId) return null;

  if (_error) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-destructive">{_error}</div>
    );
  }

  // Find the latest message from the current user
  const latestUserMessage = messages.findLast(msg => msg.sender === userId);
  // Get the absolute latest message
  const absoluteLatestMessage = messages[messages.length - 1];

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col-reverse h-full overflow-y-auto',
        '[&::-webkit-scrollbar]:w-2.5',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        'hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50',
        'dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20',
        'dark:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40',
        className
      )}
    >
      <div className="flex flex-col gap-2 p-4">
        <div ref={bottomRef} />

        {messages.map(message => (
          <Message
            key={message.id}
            id={message.id}
            content={message.content}
            sender={message.sender}
            timestamp={message.timestamp}
            status={message.status}
            error={message.error}
            type={message.type}
            isEditing={editingMessageId === message.id}
            onEdit={
              message.sender === userId
                ? (id, newContent) => editMessage(id, newContent)
                : undefined
            }
            onDelete={message.sender === userId ? id => deleteMessage(id) : undefined}
            onStartEdit={id => setEditingMessageId(id)}
            onCancelEdit={() => setEditingMessageId(null)}
            mimeType={message.mimeType}
            fileName={message.fileName}
            fileSize={message.fileSize}
            thumbnailUrl={message.thumbnailUrl}
            mediaUrl={message.mediaUrl}
            duration={message.duration}
            location={message.location}
            userId={userId || ''}
            isLatestMessage={
              message.id === latestUserMessage?.id && message.id === absoluteLatestMessage?.id
            }
          />
        ))}

        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        {_isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
