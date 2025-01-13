'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Code, Link, MapPin, Mic, Paperclip, SendHorizontal, Smile, X } from 'lucide-react';
import { ISendEventResponse } from 'matrix-js-sdk';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUploadMessage } from './file-upload-message';

interface MessageInputProps {
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

export function MessageInput({ onSend, onUpload, onTyping, className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping();

    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'inherit';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Reset height when content is cleared
  useEffect(() => {
    if (!content && textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, [content]);

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    onTyping();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsRecording(!isRecording);
    toast.info('Audio recording coming soon!');
  };

  const handleAddLocation = () => {
    // TODO: Implement location sharing
    toast.info('Location sharing coming soon!');
  };

  return (
    <div className={cn('flex flex-col gap-2 p-4 bg-background border-t', className)}>
      {/* Upload progress */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="flex items-center gap-2 text-sm">
          <span className="truncate flex-1">{fileName}</span>
          <Progress value={progress} className="w-24" />
          <span className="text-muted-foreground">{progress}%</span>
        </div>
      ))}

      {/* File preview */}
      {pendingUpload && (
        <div className="relative rounded-lg border bg-card p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleCancelUpload}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="space-y-4">
            <FileUploadMessage
              content={pendingUpload.file.name}
              type={
                pendingUpload.file.type.startsWith('image/')
                  ? 'm.image'
                  : pendingUpload.file.type.startsWith('video/')
                    ? 'm.video'
                    : pendingUpload.file.type.startsWith('audio/')
                      ? 'm.audio'
                      : 'm.file'
              }
              fileName={pendingUpload.file.name}
              fileSize={pendingUpload.file.size}
              mediaUrl={pendingUpload.previewUrl}
              mimeType={pendingUpload.file.type}
              isUploading={false}
              width={pendingUpload.metadata?.width}
              height={pendingUpload.metadata?.height}
              duration={pendingUpload.metadata?.duration}
              isPreview={true}
            />
          </div>
        </div>
      )}

      {/* Format buttons */}
      <div className="flex items-center gap-1">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept="*/*"
        />

        <TooltipProvider>
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
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', isRecording && 'text-destructive')}
                onClick={handleRecordAudio}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? 'Stop recording' : 'Record audio'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddLocation}>
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
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
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
