'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Code,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Link,
  MapPin,
  Mic,
  Paperclip,
  SendHorizontal,
  Smile,
} from 'lucide-react';
import { ISendEventResponse } from 'matrix-js-sdk';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface MessageInputProps {
  onSend: (content: string) => Promise<ISendEventResponse | void>;
  onUpload: (file: File) => Promise<ISendEventResponse>;
  onTyping: () => void;
  className?: string;
}

export function MessageInput({ onSend, onUpload, onTyping, className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    try {
      setIsSending(true);
      await onSend(trimmedContent);
      setContent('');
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
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    onTyping();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Clear the input value so the same file can be uploaded again
    e.target.value = '';

    // Convert FileList to array
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      try {
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 50MB.`);
          continue;
        }

        // Validate file type
        if (type === 'image' && !file.type.startsWith('image/')) {
          toast.error(`File ${file.name} is not an image.`);
          continue;
        } else if (type === 'video' && !file.type.startsWith('video/')) {
          toast.error(`File ${file.name} is not a video.`);
          continue;
        } else if (type === 'audio' && !file.type.startsWith('audio/')) {
          toast.error(`File ${file.name} is not an audio file.`);
          continue;
        }

        // Initialize progress for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        try {
          // Show toast while uploading
          const result = await toast.promise(onUpload(file), {
            loading: `Uploading ${file.name}...`,
            success: `${file.name} uploaded successfully!`,
            error: `Failed to upload ${file.name}`,
          });

          // Remove progress bar after successful upload
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });

          return result;
        } catch (error) {
          console.error('Failed to upload file:', error);
          // Remove progress bar on error
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          throw error;
        }
      } catch (error) {
        console.error('Failed to process file:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }
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

      {/* Format buttons */}
      <div className="flex items-center gap-1">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={e => handleFileUpload(e, 'file')}
          multiple
          accept="*/*"
        />
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          onChange={e => handleFileUpload(e, 'image')}
          multiple
          accept="image/*"
        />
        <input
          type="file"
          ref={videoInputRef}
          className="hidden"
          onChange={e => handleFileUpload(e, 'video')}
          multiple
          accept="video/*"
        />
        <input
          type="file"
          ref={audioInputRef}
          className="hidden"
          onChange={e => handleFileUpload(e, 'audio')}
          multiple
          accept="audio/*"
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
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload image</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => videoInputRef.current?.click()}
              >
                <FileVideo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload video</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => audioInputRef.current?.click()}
              >
                <FileAudio className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload audio</TooltipContent>
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
            <PopoverContent side="top" align="end" className="w-80">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>

      {/* Message input */}
      <div className="flex items-end gap-2">
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
    </div>
  );
}
