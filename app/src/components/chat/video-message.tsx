'use client';

import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

interface VideoMessageProps {
  content: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: number;
  mimeType?: string;
  className?: string;
}

export function VideoMessage({
  content,
  thumbnailUrl,
  mediaUrl,
  duration,
  mimeType,
  className,
}: VideoMessageProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!mediaUrl) {
    return <p className="text-sm text-muted-foreground">{content}</p>;
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className={cn('group relative max-w-xs overflow-hidden rounded-lg', className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt={content}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-12 w-12 text-white" />
          </div>
          {duration && (
            <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1 text-xs text-white">
              {formatDuration(duration)}
            </div>
          )}
        </button>
        {content && <p className="mt-1 text-sm text-muted-foreground">{content}</p>}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0">
          <div className="relative aspect-video w-full overflow-hidden">
            <video src={mediaUrl} controls autoPlay className="h-full w-full" poster={thumbnailUrl}>
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
