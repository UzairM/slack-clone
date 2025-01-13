'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MatrixImage } from '../matrix/matrix-image';
import { Dialog, DialogContent } from '../ui/dialog';

interface ImageMessageProps {
  content: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mimeType?: string;
  className?: string;
}

export function ImageMessage({
  content,
  thumbnailUrl,
  mediaUrl,
  mimeType,
  className,
}: ImageMessageProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!mediaUrl) {
    return <p className="text-sm text-muted-foreground">{content}</p>;
  }

  return (
    <>
      <div className={cn('group relative max-w-xs overflow-hidden rounded-lg', className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
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
        </button>
        {content && <p className="mt-1 text-sm text-muted-foreground">{content}</p>}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0">
          <div className="relative aspect-auto max-h-[80vh] w-full overflow-hidden">
            <MatrixImage
              mxcUrl={mediaUrl}
              alt={content}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
