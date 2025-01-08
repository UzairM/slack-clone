'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Message } from '@/lib/matrix/messages';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, Clock, Edit2, MessageSquare, MoreVertical, Smile, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
  message: Message;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onReply?: (messageId: string) => void;
  onReaction?: (messageId: string, reaction: string) => Promise<void>;
  className?: string;
}

export function Message({
  message,
  onEdit,
  onDelete,
  onReply,
  onReaction,
  className,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  // Function to detect and parse code blocks
  const parseContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts;
  };

  const handleEdit = async () => {
    if (!onEdit) return;
    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const contentParts = parseContent(message.content);

  return (
    <div
      className={cn('group relative flex items-start gap-3 px-4 py-2 hover:bg-accent/5', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} />
        <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{message.sender.name}</span>
          <span className="text-xs text-muted-foreground">{format(message.timestamp, 'p')}</span>
          {message.isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
          {message.status === 'sending' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Sending...</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {message.status === 'sent' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Check className="h-3 w-3 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>Sent</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full min-h-[100px] p-2 rounded-md border"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {contentParts.map((part, index) => (
              <div key={index}>
                {part.type === 'text' ? (
                  <p className="text-sm whitespace-pre-wrap">{part.content}</p>
                ) : (
                  <SyntaxHighlighter
                    language={part.language}
                    style={vscDarkPlus}
                    className="rounded-md !my-2"
                  >
                    {part.content}
                  </SyntaxHighlighter>
                )}
              </div>
            ))}
          </div>
        )}

        {message.replyTo && (
          <div className="mt-1 text-sm text-muted-foreground">
            Replying to <span className="font-medium">{message.replyTo.sender}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => onReply?.(message.id)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => onReaction?.(message.id, '👍')}
          >
            <Smile className="h-4 w-4 mr-1" />
            React
          </Button>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Display reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(message.reactions).map(([reaction, count]) => (
              <Button
                key={reaction}
                size="sm"
                variant="outline"
                className="h-6 px-2 py-1 text-xs hover:bg-accent"
                onClick={() => onReaction?.(message.id, reaction)}
              >
                {reaction} {count}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
