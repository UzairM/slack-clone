'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMatrix } from '@/hooks/use-matrix';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Code, Link, MapPin, Paperclip, SendHorizontal, Smile, X } from 'lucide-react';
import { ISendEventResponse } from 'matrix-js-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUploadMessage } from './file-upload-message';
import { UserMentionList } from './user-mention-list';

interface MessageInputProps {
  roomId: string;
  onSend: (content: string) => Promise<ISendEventResponse | void>;
  onUpload: (file: File) => Promise<ISendEventResponse>;
  onTyping: () => void;
  className?: string;
}

interface PendingUpload {
  file: File;
  message: string;
  previewUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface UserInfo {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export function MessageInput({ roomId, onSend, onUpload, onTyping, className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { client } = useMatrix();
  const { userId } = useAuthStore();

  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionAnchorPos, setMentionAnchorPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [roomMembers, setRoomMembers] = useState<UserInfo[]>([]);

  // Load room members
  useEffect(() => {
    if (!client || !userId) return;

    const loadMembers = async () => {
      try {
        const room = client.getRoom(roomId);
        if (!room) return;

        const members = room.getJoinedMembers();
        const memberInfo = members
          .filter(member => member.userId !== userId)
          .map(member => {
            const avatarUrl = member.getAvatarUrl?.(client.baseUrl, 32, 32, 'crop', true, false);
            return {
              userId: member.userId,
              displayName: member.name,
              avatarUrl: avatarUrl
                ? client.mxcUrlToHttp(avatarUrl, 32, 32, 'crop', true, false) || undefined
                : undefined,
            } satisfies UserInfo;
          });

        setRoomMembers(memberInfo);
      } catch (error) {
        console.error('Failed to load room members:', error);
      }
    };

    loadMembers();
  }, [client, roomId, userId]);

  // Handle mention query
  const handleMentionQuery = useCallback(
    (text: string, cursorPosition: number) => {
      const textBeforeCursor = text.slice(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1].toLowerCase();
        setMentionQuery(query);

        // Filter users based on query
        const filtered = roomMembers.filter(user => {
          const displayName = user.displayName || user.userId.split(':')[0].substring(1);
          return displayName.toLowerCase().includes(query);
        });

        setFilteredUsers(filtered.length > 0 ? filtered : roomMembers);
        setSelectedUserIndex(0);

        // Calculate mention list position
        if (textareaRef.current) {
          const { top, left } = textareaRef.current.getBoundingClientRect();
          const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
          const textBeforeMention = textBeforeCursor.slice(0, mentionMatch.index);

          // Create a mirror div to measure text width accurately
          const mirror = document.createElement('div');
          mirror.style.position = 'absolute';
          mirror.style.visibility = 'hidden';
          mirror.style.whiteSpace = 'pre-wrap';
          mirror.style.wordWrap = 'break-word';
          mirror.style.width = `${textareaRef.current.clientWidth}px`;
          mirror.style.font = window.getComputedStyle(textareaRef.current).font;
          mirror.textContent = textBeforeMention;
          document.body.appendChild(mirror);

          // Calculate cursor position
          const lines = Math.floor(mirror.clientHeight / lineHeight);
          const cursorTop = lines * lineHeight;
          document.body.removeChild(mirror);

          setMentionAnchorPos({
            top: top - 250, // Position above the textarea
            left: left + 10, // Slight indent from the left
          });
        }
      } else {
        setMentionQuery('');
        setMentionAnchorPos(null);
        setFilteredUsers([]);
      }
    },
    [roomMembers]
  );

  // Handle key navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionAnchorPos) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedUserIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedUserIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' && !e.shiftKey && filteredUsers.length > 0) {
        e.preventDefault();
        handleUserSelect(filteredUsers[selectedUserIndex]);
      } else if (e.key === 'Escape') {
        setMentionAnchorPos(null);
        setFilteredUsers([]);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle user selection from mention list
  const handleUserSelect = (user: UserInfo) => {
    const displayName = user.displayName || user.userId.split(':')[0].substring(1);
    const beforeMention = content.slice(0, content.lastIndexOf('@'));
    const afterMention = content.slice(content.lastIndexOf('@') + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${displayName} ${afterMention}`;
    setContent(newContent);
    setMentionAnchorPos(null);
    setFilteredUsers([]);
    textareaRef.current?.focus();
  };

  // Handle message send
  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if ((!trimmedContent && !pendingUpload) || isSending) return;

    try {
      setIsSending(true);

      if (pendingUpload) {
        // Upload file first
        const result = await onUpload(pendingUpload.file);
        // If there's a message, send it after the file
        if (trimmedContent) {
          await onSend(trimmedContent);
        }
        // Clear the pending upload
        setPendingUpload(null);
      } else {
        // Just send the message
        await onSend(trimmedContent);
      }

      setContent('');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target || !e.target.files || e.target.files.length === 0) {
        console.log('No files selected');
        return;
      }

      const file = e.target.files[0];
      console.log('Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      // Create preview URL based on file type
      let previewUrl: string | undefined;

      // Images, videos, and audio can use createObjectURL directly
      if (
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type.startsWith('audio/')
      ) {
        previewUrl = URL.createObjectURL(file);
      }

      // For images, get dimensions
      let dimensions: { width?: number; height?: number } = {};
      if (file.type.startsWith('image/')) {
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              dimensions = {
                width: img.width,
                height: img.height,
              };
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
          });
          URL.revokeObjectURL(img.src); // Clean up the temporary URL
        } catch (error) {
          console.error('Failed to get image dimensions:', error);
        }
      }

      // For audio/video, get duration
      let duration: number | undefined;
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        try {
          const media = file.type.startsWith('audio/')
            ? new Audio()
            : document.createElement('video');
          await new Promise<void>((resolve, reject) => {
            media.onloadedmetadata = () => {
              duration = media.duration;
              resolve();
            };
            media.onerror = () => reject(new Error('Failed to load media'));
            media.src = URL.createObjectURL(file);
          });
          URL.revokeObjectURL(media.src); // Clean up the temporary URL
        } catch (error) {
          console.error('Failed to get media duration:', error);
        }
      }

      // Set the pending upload with additional metadata
      setPendingUpload({
        file,
        message: '',
        previewUrl,
        metadata: {
          ...dimensions,
          duration,
        },
      });

      // Focus the textarea for the message
      textareaRef.current?.focus();

      // Clear the input value so the same file can be uploaded again
      e.target.value = '';
    } catch (error) {
      console.error('Failed to process file:', error);
      toast.error('Failed to process file');
    }
  };

  const handleCancelUpload = () => {
    if (pendingUpload?.previewUrl) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
    }
    setPendingUpload(null);
  };

  const handleRecordAudio = () => {
    // TODO: Implement audio recording
    toast.info('Audio recording coming soon!');
  };

  const handleAddLocation = () => {
    // TODO: Implement location sharing
    toast.info('Location sharing coming soon!');
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    onTyping();
  };

  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setContent(newContent);
    handleMentionQuery(newContent, cursorPosition);
    onTyping();
  };

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Mention suggestions */}
      {mentionAnchorPos && filteredUsers.length > 0 && (
        <div className="absolute bottom-[100%] left-4 z-50 mb-2">
          <UserMentionList
            users={filteredUsers}
            selectedIndex={selectedUserIndex}
            onSelect={handleUserSelect}
            className="w-[250px]"
          />
        </div>
      )}

      {/* File upload preview */}
      {pendingUpload && (
        <div className="relative rounded-lg border bg-muted/50 p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-full"
            onClick={() => setPendingUpload(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <FileUploadMessage
            content={pendingUpload.message}
            type="m.file"
            fileName={pendingUpload.file.name}
            fileSize={pendingUpload.file.size}
            isUploading={true}
          />
          <Progress value={uploadProgress} className="mt-2" />
        </div>
      )}

      {/* Input toolbar */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple={false}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MapPin className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share location</TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert link</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 p-0 border-none">
              <div className="rounded-md border bg-popover">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>

      {/* Message input */}
      <div className="relative flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={pendingUpload ? 'Add a message...' : 'Type a message...'}
          className="min-h-[40px] max-h-[200px] resize-none overflow-y-auto py-2"
          rows={1}
          autoFocus
          disabled={isSending}
        />
        <Button
          size="icon"
          className="h-10 shrink-0"
          onClick={handleSubmit}
          disabled={(!content.trim() && !pendingUpload) || isSending}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
