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
    searchPublicRooms();
  }, [searchPublicRooms]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      setJoiningRoomId(roomId);
      await joinRoom(roomId);
      toast.success('Joined room successfully');
    } catch (error: any) {
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

      {publicRoomsError && <div className="text-sm text-destructive">{publicRoomsError}</div>}

      <ScrollArea className="h-[400px] rounded-md border">
        {isLoadingPublicRooms ? (
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={joiningRoomId === room.id}
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
