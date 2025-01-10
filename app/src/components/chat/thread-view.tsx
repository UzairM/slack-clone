'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Message } from './message';
import { MessageInput } from './message-input';

interface ThreadViewProps {
  roomId: string;
  threadId: string;
  onClose: () => void;
  className?: string;
}

export function ThreadView({ roomId, threadId, onClose, className }: ThreadViewProps) {
  const { userId } = useAuthStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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
    typingUsers: _typingUsers,
    handleUserTyping,
    uploadFile,
  } = useMatrixMessages(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && shouldAutoScroll) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  // Filter messages to only show thread messages
  const threadMessages = messages.filter(msg => msg.id === threadId || msg.threadId === threadId);
  const rootMessage = messages.find(msg => msg.id === threadId);

  if (!userId) return null;

  // Find the latest message from the current user in the thread
  const latestUserMessage = threadMessages.findLast(msg => msg.sender === userId);
  // Get the absolute latest message in the thread
  const absoluteLatestMessage = threadMessages[threadMessages.length - 1];

  // Handle edit start
  const handleStartEdit = (id: string) => {
    setEditingMessageId(id);
  };

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
    setShouldAutoScroll(isNearBottom);
  };

  // Handle sending thread messages
  const handleSend = async (content: string) => {
    await sendMessage(content, { threadId });
  };

  // Handle file uploads in thread
  const handleUpload = async (file: File) => {
    const result = await uploadFile(file);
    return result;
  };

  return (
    <div className={cn('flex h-full flex-col border-l', className)}>
      {/* Thread header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">Thread</h3>
          <p className="text-sm text-muted-foreground">
            {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close thread</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Thread messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4
          [&::-webkit-scrollbar]:w-2.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
          dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
          dark:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
      >
        <div className="space-y-4">
          {/* Root message */}
          {rootMessage && (
            <Message
              {...rootMessage}
              userId={userId}
              isLatestMessage={
                rootMessage.id === latestUserMessage?.id &&
                rootMessage.id === absoluteLatestMessage?.id
              }
              onEdit={editMessage}
              onDelete={deleteMessage}
              onStartEdit={handleStartEdit}
              onCancelEdit={
                editingMessageId === rootMessage.id ? () => setEditingMessageId(null) : undefined
              }
              isEditing={editingMessageId === rootMessage.id}
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
              className="border border-border dark:border-border-dark rounded-md"
            />
          )}

          {/* Thread replies */}
          <div className="ml-6 space-y-4 border-l pl-4">
            {threadMessages
              .filter(msg => msg.id !== threadId)
              .map(message => (
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
                />
              ))}
          </div>
        </div>
      </div>

      {/* Thread input */}
      <div className="border-t p-4">
        <MessageInput onSend={handleSend} onUpload={handleUpload} onTyping={handleUserTyping} />
      </div>
    </div>
  );
}
