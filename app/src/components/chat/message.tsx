'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, Loader2, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { AudioMessage } from './audio-message';
import { EmoteMessage } from './emote-message';
import { FileMessage } from './file-message';
import { ImageMessage } from './image-message';
import { LocationMessage } from './location-message';
import { VideoMessage } from './video-message';

interface MessageProps {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  error?: string;
  isEdited?: boolean;
  editedTimestamp?: number;
  originalContent?: string;
  isEditing?: boolean;
  onEdit?: (id: string, newContent: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onStartEdit?: (id: string) => void;
  onCancelEdit?: () => void;
  className?: string;
  type: 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.location' | 'm.emote';
  // Additional props for rich content
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: number;
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
}

export function Message({
  id,
  content,
  sender,
  timestamp,
  status,
  error,
  isEdited,
  editedTimestamp,
  originalContent,
  isEditing,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit,
  className,
  type,
  mimeType,
  fileName,
  fileSize,
  thumbnailUrl,
  mediaUrl,
  duration,
  location,
}: MessageProps) {
  const [editContent, setEditContent] = useState(content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!onEdit || editContent.trim() === content) {
      onCancelEdit?.();
      return;
    }

    try {
      setIsSaving(true);
      await onEdit(id, editContent.trim());
      onCancelEdit?.();
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      onCancelEdit?.();
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[60px] w-full resize-none"
            placeholder="Edit your message..."
            disabled={isSaving}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEditSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {(() => {
          switch (type) {
            case 'm.text':
              return <p className="whitespace-pre-wrap text-sm">{content}</p>;
            case 'm.emote':
              return <EmoteMessage content={content} sender={sender} />;
            case 'm.image':
              return (
                <ImageMessage
                  content={content}
                  thumbnailUrl={thumbnailUrl}
                  mediaUrl={mediaUrl}
                  mimeType={mimeType}
                />
              );
            case 'm.file':
              return (
                <FileMessage
                  content={content}
                  fileName={fileName}
                  fileSize={fileSize}
                  mediaUrl={mediaUrl}
                  mimeType={mimeType}
                />
              );
            case 'm.audio':
              return (
                <AudioMessage
                  content={content}
                  mediaUrl={mediaUrl}
                  duration={duration}
                  mimeType={mimeType}
                />
              );
            case 'm.video':
              return (
                <VideoMessage
                  content={content}
                  thumbnailUrl={thumbnailUrl}
                  mediaUrl={mediaUrl}
                  duration={duration}
                  mimeType={mimeType}
                />
              );
            case 'm.location':
              return location ? (
                <LocationMessage
                  latitude={location.latitude}
                  longitude={location.longitude}
                  description={location.description}
                />
              ) : null;
            default:
              return <p className="whitespace-pre-wrap text-sm">{content}</p>;
          }
        })()}
        {isEdited && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button
              onClick={() => setShowEditHistory(!showEditHistory)}
              className="hover:underline focus:outline-none"
            >
              (edited {formatDistanceToNow(editedTimestamp || 0, { addSuffix: true })})
            </button>
          </div>
        )}
        {showEditHistory && originalContent && (
          <div className="rounded-md border bg-muted/50 p-2 text-xs text-muted-foreground">
            <div className="font-medium">Original message:</div>
            <p className="mt-1 whitespace-pre-wrap">{originalContent}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('group relative flex gap-3 px-4 py-2 hover:bg-muted/50', className)}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sender}`} />
        <AvatarFallback>{sender[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{sender}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            {status === 'sending' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending
              </>
            )}
            {status === 'sent' && (
              <>
                <Check className="h-3 w-3" />
                Sent
              </>
            )}
            {status === 'delivered' && (
              <>
                <Check className="h-3 w-3" />
                <Check className="h-3 w-3" />
                Delivered
              </>
            )}
            {status === 'read' && (
              <>
                <Check className="h-3 w-3 text-blue-500" />
                <Check className="h-3 w-3 text-blue-500" />
                Read
              </>
            )}
            {status === 'error' && (
              <span className="text-destructive" title={error}>
                Failed to send
              </span>
            )}
          </span>
        </div>

        {renderContent()}
      </div>

      {!isEditing && (onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-2 hidden h-8 w-8 group-hover:flex"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onStartEdit?.(id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-4 w-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
