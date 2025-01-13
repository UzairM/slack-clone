'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { getMatrixMediaUrl } from '@/lib/matrix/utils';
import { cn } from '@/lib/utils';
import { Download, File, Loader2, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { MatrixImage } from '../matrix/matrix-image';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { Slider } from '../ui/slider';

interface FileUploadMessageProps {
  content: string;
  type: 'm.image' | 'm.audio' | 'm.video' | 'm.file';
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
  className?: string;
  isPreview?: boolean;
}

export function FileUploadMessage({
  content,
  type,
  fileName,
  fileSize,
  mediaUrl,
  thumbnailUrl,
  mimeType,
  duration,
  width,
  height,
  isUploading,
  uploadProgress,
  error,
  className,
  isPreview = false,
}: FileUploadMessageProps) {
  const { client } = useMatrix();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  // Get proper download URL - only for Matrix URLs, not local previews
  const downloadUrl = !isPreview
    ? getMatrixMediaUrl(client, mediaUrl, undefined, fileName)
    : mediaUrl;

  // Handle download click
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!downloadUrl) return;

    try {
      // For local previews, just open in new tab
      if (isPreview) {
        window.open(downloadUrl, '_blank');
        return;
      }

      // For Matrix URLs, download the file
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      // Use original file name if available, fallback to content, then default to a type-specific name
      const downloadFileName =
        fileName ||
        content ||
        (() => {
          switch (type) {
            case 'm.image':
              return `image.${mimeType?.split('/')[1] || 'png'}`;
            case 'm.video':
              return `video.${mimeType?.split('/')[1] || 'mp4'}`;
            case 'm.audio':
              return `audio.${mimeType?.split('/')[1] || 'mp3'}`;
            default:
              return 'download';
          }
        })();
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  // Format file size
  const formattedSize = fileSize
    ? fileSize < 1024 * 1024
      ? `${(fileSize / 1024).toFixed(1)} KB`
      : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
    : null;

  // Format time for audio/video
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Audio player controls
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Render loading state
  if (isUploading) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Loader2 className="h-5 w-5 animate-spin text-foreground/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              Uploading {fileName || content}... {uploadProgress && `${uploadProgress}%`}
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <File className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-destructive">
              Failed to upload {fileName || content}
            </p>
            <p className="text-xs text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render based on file type
  switch (type) {
    case 'm.image':
      return (
        <>
          <div className={cn('group relative max-w-xs overflow-hidden rounded-lg', className)}>
            <div className="relative">
              <button
                onClick={() => setIsImageViewerOpen(true)}
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPreview ? (
                  <Image
                    src={mediaUrl || ''}
                    alt={content}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <MatrixImage
                    mxcUrl={thumbnailUrl || mediaUrl}
                    alt={content}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    width={400}
                    height={400}
                    resizeMethod="crop"
                  />
                )}
              </button>
              {!isPreview && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleDownload}
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
            {content && <p className="mt-1 text-sm text-muted-foreground">{content}</p>}
          </div>

          <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
            <DialogContent className="max-w-4xl border-none bg-transparent p-0">
              <div className="relative aspect-auto max-h-[80vh] w-full overflow-hidden">
                {isPreview ? (
                  <Image
                    src={mediaUrl || ''}
                    alt={content}
                    className="object-contain"
                    fill
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <MatrixImage
                    mxcUrl={mediaUrl}
                    alt={content}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      );

    case 'm.audio':
      return (
        <div className={cn('space-y-1', className)}>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
            <audio
              ref={audioRef}
              src={downloadUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </Button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <Slider
                  value={[currentTime]}
                  max={duration || audioRef.current?.duration || 0}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="flex-1"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>

            {!isPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDownload}
                title="Download audio"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>

          {content && <p className="text-sm text-muted-foreground">{content}</p>}
        </div>
      );

    case 'm.video':
      return (
        <div className={cn('space-y-1', className)}>
          <div className="relative max-w-xs overflow-hidden rounded-lg">
            <video
              src={downloadUrl}
              poster={thumbnailUrl}
              controls
              className="w-full rounded-lg bg-muted"
            />
            {!isPreview && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                onClick={handleDownload}
                title="Download video"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
          {content && <p className="text-sm text-muted-foreground">{content}</p>}
        </div>
      );

    case 'm.file':
    default:
      return (
        <div className={cn('space-y-1', className)}>
          <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <File className="h-5 w-5 text-foreground/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fileName || content}</p>
              {(mimeType || formattedSize) && (
                <p className="text-xs text-muted-foreground">
                  {[mimeType, formattedSize].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
            {!isPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
  }
}
