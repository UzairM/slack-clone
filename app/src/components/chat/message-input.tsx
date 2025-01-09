'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import { ISendEventResponse } from 'matrix-js-sdk';
import { useState } from 'react';

interface MessageInputProps {
  onSend: (content: string) => Promise<ISendEventResponse | void>;
  onTyping: () => void;
  className?: string;
}

export function MessageInput({ onSend, onTyping, className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    try {
      setIsSending(true);
      await onSend(trimmedContent);
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping();
  };

  return (
    <div className="flex items-end gap-2 p-4 bg-background border-t">
      <Textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
        className="min-h-[60px] max-h-[200px] resize-none"
        disabled={isSending}
      />
      <Button
        size="icon"
        className="h-[60px] shrink-0"
        onClick={handleSubmit}
        disabled={!content.trim() || isSending}
      >
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </div>
  );
}
