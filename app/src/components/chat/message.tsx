'use client';

import { AvatarWithPresence } from '@/components/chat/avatar-with-presence';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMatrix } from '@/hooks/use-matrix';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { EmoteMessage } from './emote-message';
import { FileUploadMessage } from './file-upload-message';
import { LocationMessage } from './location-message';
import { MessageReactions } from './message-reactions';

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
  onAddReaction?: (id: string, reaction: string) => Promise<void>;
  onRemoveReaction?: (id: string, reaction: string) => Promise<void>;
  reactions?: {
    [key: string]: {
      count: number;
      userIds: string[];
    };
  };
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
  threadId?: string;
  isThreadRoot?: boolean;
  thread?: {
    latestReply?: {
      id: string;
      content: string;
      sender: string;
      timestamp: number;
    };
    replyCount: number;
    isUnread: boolean;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  onThreadClick?: (threadId: string) => void;
  userId: string;
  isLatestMessage?: boolean;
  isHidden?: boolean;
  isInThreadView?: boolean;
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
  onAddReaction,
  onRemoveReaction,
  reactions = {},
  className,
  type,
  mimeType,
  fileName,
  fileSize,
  thumbnailUrl,
  mediaUrl,
  duration,
  location,
  threadId,
  isThreadRoot,
  thread,
  replyTo,
  onThreadClick,
  userId,
  isLatestMessage,
  isHidden,
  isInThreadView,
}: MessageProps) {
  const { client } = useMatrix();
  const [editContent, setEditContent] = useState(content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sender)}`
  );
  const [displayName, setDisplayName] = useState<string>(sender.slice(1).split(':')[0]);

  // Get user avatar and display name
  useEffect(() => {
    if (!client) return;

    const user = client.getUser(sender);
    if (user && user.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      // Only update display name if user has set a custom one
      const customName = user.displayName;
      if (customName && customName !== sender) {
        setDisplayName(customName);
      }
    } else {
      // Use Dicebear as fallback
      setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sender)}`);
    }
  }, [client, sender]);

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
      toast.error('Failed to edit message');
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
      // No need to manually hide the message as it will be removed from the messages list
    } catch (error) {
      toast.error('Failed to delete message');
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

    const messageDate = new Date(timestamp);
    const isToday = new Date().toDateString() === messageDate.toDateString();
    const isThisYear = new Date().getFullYear() === messageDate.getFullYear();

    let timeString;
    if (isToday) {
      timeString = format(messageDate, 'h:mm a');
    } else if (isThisYear) {
      timeString = format(messageDate, 'MMM d, h:mm a');
    } else {
      timeString = format(messageDate, 'MMM d, yyyy h:mm a');
    }

    return (
      <div className="space-y-1">
        <div className="relative">
          {(() => {
            switch (type) {
              case 'm.text':
                return <p className="whitespace-pre-wrap text-sm">{content}</p>;
              case 'm.emote':
                return <EmoteMessage content={content} sender={sender} />;
              case 'm.image':
              case 'm.audio':
              case 'm.video':
              case 'm.file':
                return (
                  <FileUploadMessage
                    content={content}
                    type={type}
                    fileName={fileName}
                    fileSize={fileSize}
                    mediaUrl={mediaUrl}
                    thumbnailUrl={thumbnailUrl}
                    mimeType={mimeType}
                    duration={duration}
                    isUploading={status === 'sending'}
                    error={error}
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
          <div className="mt-1 flex items-center justify-end">
            <span className="text-[10px] font-medium text-muted-foreground/60">{timeString}</span>
          </div>
        </div>
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
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3 transition-colors hover:bg-[#AACFF3]/40 dark:hover:bg-muted/50',
        'first:pt-4 last:pb-4',
        isHidden && 'hidden',
        className
      )}
    >
      <div className="relative">
        <AvatarWithPresence
          userId={sender}
          avatarUrl={avatarUrl || undefined}
          displayName={displayName}
          className="ring-2 ring-background"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold hover:underline cursor-pointer">
            {displayName}
          </span>
          <div className="flex items-center gap-1">
            {sender === userId && isLatestMessage && (
              <>
                {status === 'sending' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </TooltipTrigger>
                      <TooltipContent>Sending...</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {status === 'error' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Failed to send {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {status === 'sent' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Check className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Sent {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {status === 'delivered' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Check className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Delivered {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {status === 'read' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CheckCheck className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Read {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reply reference */}
        {replyTo && (
          <div className="mb-1 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
            <div className="truncate">
              <span className="font-medium">{replyTo.sender}</span>: {replyTo.content}
            </div>
          </div>
        )}

        <div className="relative">
          {renderContent()}

          {/* Edit history */}
          {isEdited && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <button
                onClick={() => setShowEditHistory(!showEditHistory)}
                className="hover:underline focus:outline-none"
              >
                edited {formatDistanceToNow(editedTimestamp || 0, { addSuffix: true })}
              </button>
            </div>
          )}
          {showEditHistory && originalContent && (
            <div className="mt-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
              <div className="font-medium">Original message:</div>
              <p className="mt-1 whitespace-pre-wrap">{originalContent}</p>
            </div>
          )}
        </div>

        {/* Thread preview */}
        {isThreadRoot && thread && (
          <button
            onClick={() => onThreadClick?.(id)}
            className="mt-2 flex w-full items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex-1">
              {thread.latestReply ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{thread.latestReply.sender}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(thread.latestReply.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-muted-foreground">{thread.latestReply.content}</p>
                </div>
              ) : null}
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                {thread.isUnread && (
                  <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary" />
                )}
              </p>
            </div>
          </button>
        )}

        {/* Message reactions */}
        {onAddReaction && onRemoveReaction && (
          <MessageReactions
            messageId={id}
            reactions={reactions}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
            className="mt-1.5"
          />
        )}
      </div>

      {/* Message actions */}
      <div
        className={cn(
          'absolute right-4 top-2 flex items-center gap-1 opacity-0 transition-opacity',
          'group-hover:opacity-100'
        )}
      >
        {/* Thread button */}
        {!isThreadRoot && onThreadClick && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => onThreadClick(id)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Thread</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit and Delete buttons - only for user's messages and not for thread roots */}
        {sender === userId && (
          <>
            {onEdit && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => onStartEdit?.(id)}
                      disabled={isDeleting}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onDelete && (!isThreadRoot || !isInThreadView) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive',
                      isThreadRoot && isInThreadView && 'hidden'
                    )}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete message?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </div>
  );
}
