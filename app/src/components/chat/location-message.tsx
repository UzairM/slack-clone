'use client';

import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  description?: string;
  className?: string;
}

export function LocationMessage({
  latitude,
  longitude,
  description,
  className,
}: LocationMessageProps) {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&zoom=15`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            alt={description || 'Location'}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex items-center gap-2 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MapPin className="h-5 w-5 text-foreground/60" />
          </div>
          <div className="min-w-0 flex-1">
            {description && <p className="truncate text-sm font-medium">{description}</p>}
            <p className="text-xs text-muted-foreground">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => window.open(directionsUrl, '_blank')}
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
