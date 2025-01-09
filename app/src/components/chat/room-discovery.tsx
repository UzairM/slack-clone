'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Loader2, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RoomDiscoveryProps {
  className?: string;
}

function LoadingPulse() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
      <div className="space-y-3">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/10">
            <div className="h-full w-full animate-pulse rounded-full bg-primary/20" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <div className="text-sm font-medium text-muted-foreground">Connecting to server</div>
          <div className="flex justify-center space-x-1">
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoomDiscovery({ className }: RoomDiscoveryProps) {
  const { publicRooms, isLoadingPublicRooms, publicRoomsError, searchPublicRooms, joinRoom } =
    useMatrixRooms();

  const [searchTerm, setSearchTerm] = useState('');
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(
    async (term: string) => {
      try {
        await searchPublicRooms(term);
      } catch (error) {
        // Error is already handled in the hook
      }
    },
    [searchPublicRooms]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Initial load
  useEffect(() => {
    const loadRooms = async () => {
      try {
        await searchPublicRooms();
      } catch (error) {
        // Error is already handled in the hook
        console.warn('Initial room load failed:', error);
      }
    };
    loadRooms();
  }, [searchPublicRooms]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      setJoiningRoomId(roomId);
      await joinRoom(roomId);
      toast.success('Joined room successfully');
    } catch (error: any) {
      console.error('Failed to join room:', error);
      toast.error(error.message || 'Failed to join room');
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search public rooms..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {publicRoomsError && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{publicRoomsError}</span>
        </div>
      )}

      <ScrollArea className="h-[400px] rounded-md border">
        {publicRoomsError ? (
          <LoadingPulse />
        ) : isLoadingPublicRooms ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : publicRooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-lg font-medium">No rooms found</div>
            <div className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Try a different search term'
                : 'No public rooms are currently available'}
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {publicRooms.map(room => (
              <div
                key={room.id}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="truncate font-medium">{room.name}</div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{room.memberCount}</span>
                    </div>
                  </div>
                  {room.topic && (
                    <div className="mt-1 truncate text-sm text-muted-foreground">{room.topic}</div>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={joiningRoomId === room.id}
                  className="min-w-[80px] font-medium"
                >
                  {joiningRoomId === room.id ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
