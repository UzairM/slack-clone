'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastScrollHeightRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  const messageCountRef = useRef<number>(0);
  const searchParams = useSearchParams();
  const highlightedMessageId = searchParams.get('highlight');

  const {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    typingUsers,
    handleUserTyping,
    uploadFile,
  } = useMatrixMessages(roomId);

  // Handle message editing
  const handleStartEdit = useCallback((id: string) => {
    setEditingMessageId(id);
  }, []);

  // Handle thread click
  const handleThreadClick = useCallback((id: string) => {
    setActiveThreadId(id);
  }, []);

  // Track message count changes
  useEffect(() => {
    const prevCount = messageCountRef.current;
    messageCountRef.current = messages.length;

    // If we have new messages and should auto-scroll
    if (messages.length > prevCount && shouldAutoScroll) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const { scrollHeight, clientHeight } = scrollContainerRef.current;
          scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
      });
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll events for pagination and auto-scroll
  const handleScroll = useCallback(async () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Check if we should load more messages (near top)
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      lastScrollHeightRef.current = scrollHeight;

      try {
        await loadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }

    // Check if we should auto-scroll (near bottom)
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = distanceFromBottom < 100;
    setShouldAutoScroll(isNearBottom);
  }, [hasMore, isLoadingMore, loadMore]);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (isLoadingMore && scrollContainerRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          const scrollDiff = newScrollHeight - lastScrollHeightRef.current;
          scrollContainerRef.current.scrollTop = scrollDiff;
        }
      });
    }
  }, [messages, isLoadingMore]);

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current && isInitialLoadRef.current && !isLoading) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
      isInitialLoadRef.current = false;
    }
  }, [isLoading]);

  // Reset scroll and loading state when room changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
      setShouldAutoScroll(true);
      setIsLoadingMore(false);
      isInitialLoadRef.current = true;
      messageCountRef.current = 0;
    }
  }, [roomId]);

  // Handle highlighted message scroll
  useEffect(() => {
    if (!highlightedMessageId || !scrollContainerRef.current || isLoading) return;

    // Try to find and scroll to the message
    const scrollToMessage = () => {
      const messageElement = document.getElementById(`message-${highlightedMessageId}`);
      if (messageElement) {
        // Wait a bit for the layout to stabilize
        setTimeout(() => {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          messageElement.classList.add('bg-[#AACFF3]/20', 'dark:bg-muted/20');
          setTimeout(() => {
            messageElement.classList.remove('bg-[#AACFF3]/20', 'dark:bg-muted/20');
          }, 2000);
        }, 100);
        return true;
      }
      return false;
    };

    // If message not found and we have more messages, load them
    const tryLoadAndScroll = async () => {
      let attempts = 0;
      const maxAttempts = 5;

      while (!scrollToMessage() && hasMore && attempts < maxAttempts) {
        try {
          await loadMore();
          attempts++;
        } catch (error) {
          console.error('Failed to load more messages:', error);
          break;
        }
      }

      // One final attempt after all messages are loaded
      if (!scrollToMessage()) {
        console.log('Could not find message:', highlightedMessageId);
      }
    };

    // Initial attempt
    tryLoadAndScroll();
  }, [highlightedMessageId, messages, isLoading, hasMore, loadMore]);

  // Return early if no userId
  if (!userId) return null;

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
            {/* Loading indicator */}
            {isLoadingMore && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-4 text-sm text-destructive text-center">
                Failed to load messages: {error}
              </div>
            )}

            {/* Messages */}
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
                  className={cn(
                    'transition-colors duration-300',
                    message.id === highlightedMessageId && 'bg-[#AACFF3]/20 dark:bg-muted/20'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Message input and typing indicator */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background">
          <MessageInput
            roomId={roomId}
            onSend={sendMessage}
            onUpload={uploadFile}
            onTyping={handleUserTyping}
          />
          {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
        </div>
      </div>

      {/* Thread view */}
      {activeThreadId && (
        <ThreadView
          roomId={roomId}
          threadId={activeThreadId}
          onClose={() => setActiveThreadId(null)}
          className="w-[400px] border-l z-40"
        />
      )}
    </div>
  );
}
