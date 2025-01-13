'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { getMatrixImageUrl, getMatrixMediaUrl } from '@/lib/matrix/utils';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { MatrixImage } from '../matrix/matrix-image';
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
  const { client } = useMatrix();

  if (!mediaUrl) {
    return <p className="text-sm text-muted-foreground">{content}</p>;
  }

  // Convert video URL to HTTP URL
  const videoHttpUrl = getMatrixMediaUrl(client, mediaUrl);

  // Format duration
  const formattedDuration = duration
    ? new Date(duration).toISOString().substr(11, 8).replace(/^00:/, '')
    : undefined;

  return (
    <>
      <div className={cn('group relative max-w-xs overflow-hidden rounded-lg', className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {thumbnailUrl ? (
            <MatrixImage
              mxcUrl={thumbnailUrl}
              alt={content}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              width={400}
              height={400}
              resizeMethod="crop"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {formattedDuration && (
            <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1 py-0.5 text-xs text-white">
              {formattedDuration}
            </div>
          )}
        </button>
        {content && <p className="mt-1 text-sm text-muted-foreground">{content}</p>}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0">
          <div className="relative aspect-video w-full overflow-hidden">
            <video
              src={videoHttpUrl}
              controls
              autoPlay
              className="h-full w-full"
              poster={thumbnailUrl ? getMatrixImageUrl(client, thumbnailUrl) : undefined}
            >
              <source src={videoHttpUrl} type={mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
