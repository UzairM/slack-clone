'use client';

import { useMatrixMessages } from '@/hooks/use-matrix-messages';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { MessageInput } from './message-input';
import { MessageList } from './message-list';

interface ChatContainerProps {
  roomId: string;
  className?: string;
}

export function ChatContainer({ roomId, className }: ChatContainerProps) {
  const { sendMessage, handleUserTyping } = useMatrixMessages(roomId);

  // Reset scroll when room changes
  useEffect(() => {
    const container = document.querySelector('.message-list-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [roomId]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex-1 overflow-hidden message-list-container">
        <MessageList roomId={roomId} />
      </div>
      <MessageInput onSend={sendMessage} onTyping={handleUserTyping} />
    </div>
  );
}
