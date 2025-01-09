'use client';

import { cn } from '@/lib/utils';
import { Download, File } from 'lucide-react';
import { Button } from '../ui/button';

interface FileMessageProps {
  content: string;
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
  mimeType?: string;
  className?: string;
}

export function FileMessage({
  content,
  fileName,
  fileSize,
  mediaUrl,
  mimeType,
  className,
}: FileMessageProps) {
  if (!mediaUrl) {
    return <p className="text-sm text-muted-foreground">{content}</p>;
  }

  const formattedSize = fileSize
    ? fileSize < 1024 * 1024
      ? `${(fileSize / 1024).toFixed(1)} KB`
      : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
    : null;

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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => window.open(mediaUrl, '_blank')}
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
