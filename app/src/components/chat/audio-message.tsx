'use client';

import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface AudioMessageProps {
  content: string;
  mediaUrl?: string;
  duration?: number;
  mimeType?: string;
  className?: string;
}

export function AudioMessage({
  content,
  mediaUrl,
  duration,
  mimeType,
  className,
}: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  if (!mediaUrl) {
    return <p className="text-sm text-muted-foreground">{content}</p>;
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
        <audio
          ref={audioRef}
          src={mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={togglePlayback}>
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
      </div>

      {content && <p className="text-sm text-muted-foreground">{content}</p>}
    </div>
  );
}
