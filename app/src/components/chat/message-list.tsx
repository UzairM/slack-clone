'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Message } from './message';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
  roomId: string;
  className?: string;
}

export function MessageList({ roomId, className }: MessageListProps) {
  const {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    typingUsers,
  } = useMatrixMessages(roomId);
  const { userId } = useAuthStore();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (container.scrollTop === 0 && hasMore && !isLoading) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadMore]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-destructive">{error}</div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col space-y-2 overflow-y-auto p-4">
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

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
            message.sender === userId ? (id, newContent) => editMessage(id, newContent) : undefined
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
        />
      ))}

      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

      <div ref={bottomRef} />
    </div>
  );
}
