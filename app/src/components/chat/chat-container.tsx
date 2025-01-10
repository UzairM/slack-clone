'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Message } from './message';
import { MessageInput } from './message-input';
import { ThreadView } from './thread-view';
import { TypingIndicator } from './typing-indicator';

interface ChatContainerProps {
  roomId: string;
  className?: string;
}

export function ChatContainer({ roomId, className }: ChatContainerProps) {
  const { userId } = useAuthStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const {
    messages,
    isLoading: _isLoading,
    error: _error,
    hasMore: _hasMore,
    loadMore: _loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    typingUsers,
    handleUserTyping,
    uploadFile,
  } = useMatrixMessages(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && shouldAutoScroll) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  // Reset scroll when room changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setShouldAutoScroll(true);
    }
  }, [roomId]);

  // Return early if no userId
  if (!userId) return null;

  // Handle edit start
  const handleStartEdit = (id: string) => {
    setEditingMessageId(id);
  };

  // Handle thread click
  const handleThreadClick = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
    setShouldAutoScroll(isNearBottom);
  };

  // Filter out thread replies from the main chat
  const mainMessages = messages.filter(msg => !msg.threadId);

  // Find the latest message from the current user
  const latestUserMessage = mainMessages.findLast(msg => msg.sender === userId);
  // Get the absolute latest message
  const absoluteLatestMessage = mainMessages[mainMessages.length - 1];

  return (
    <div className={cn('flex h-full relative', className)}>
      {/* Main chat */}
      <div className="flex-1 flex flex-col relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 bottom-[88px] overflow-y-auto
            [&::-webkit-scrollbar]:w-2.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
            dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          <div className="flex flex-col justify-end min-h-full">
            <div className="space-y-2 px-4 py-4">
              {mainMessages.map(message => (
                <Message
                  key={message.id}
                  {...message}
                  userId={userId}
                  isLatestMessage={
                    message.id === latestUserMessage?.id && message.id === absoluteLatestMessage?.id
                  }
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={
                    editingMessageId === message.id ? () => setEditingMessageId(null) : undefined
                  }
                  isEditing={editingMessageId === message.id}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onThreadClick={handleThreadClick}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background">
          <MessageInput onSend={sendMessage} onUpload={uploadFile} onTyping={handleUserTyping} />
          {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
        </div>
      </div>

      {/* Thread view */}
      {activeThreadId && (
        <ThreadView
          roomId={roomId}
          threadId={activeThreadId}
          onClose={() => setActiveThreadId(null)}
          className="w-[400px] border-l"
        />
      )}
    </div>
  );
}
