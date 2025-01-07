'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';

interface MessageItem {
  id: number;
  content: string;
  height: number;
  author: string;
  timestamp: Date;
}

// Generate a large dataset for testing
const generateItems = (count: number): MessageItem[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    content: `Message ${index + 1}`,
    height: Math.floor(Math.random() * 100) + 50, // Random height between 50-150px
    author: `User ${Math.floor(Math.random() * 10) + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 10000000000),
  }));
};

export function VirtualTest() {
  const [items] = useState<MessageItem[]>(() => generateItems(10000));
  const parentRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<{ [key: number]: number }>({});

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => measurements[index] || 70,
    overscan: 5,
    measureElement: (element: HTMLElement) => {
      const height = element.getBoundingClientRect().height;
      setMeasurements(prev => ({
        ...prev,
        [element.dataset.index as unknown as number]: height,
      }));
      return height;
    },
  });

  // Performance monitoring
  const [fps, setFps] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;
    let lastScrollTime = performance.now();

    const measureFPS = () => {
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }

      frameCount.current++;
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    const handleScroll = () => {
      if (!parentRef.current) return;
      const now = performance.now();
      const scrollTop = parentRef.current.scrollTop;
      setScrollPosition(scrollTop);
      lastScrollTime = now;
    };

    parentRef.current?.addEventListener('scroll', handleScroll);
    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      parentRef.current?.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const range = virtualizer.range;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted rounded">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">FPS:</span> {fps}
          </div>
          <div className="text-sm">
            <span className="font-medium">Scroll Position:</span> {Math.round(scrollPosition)}px
          </div>
          <div className="text-sm">
            <span className="font-medium">Visible Range:</span> {range?.startIndex ?? 0} -{' '}
            {range?.endIndex ?? 0} of {items.length}
          </div>
        </div>
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualItem => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={`absolute top-0 left-0 w-full ${
                  virtualItem.index % 2 ? 'bg-muted/50' : ''
                }`}
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.author}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{item.content}</p>
                  <div className="text-xs text-muted-foreground">Message ID: {item.id}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
