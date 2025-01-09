'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Loader2, Lock, MessageSquare, Plus, Search, Settings, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoomManagement } from './room-management';

interface RoomSidebarProps {
  className?: string;
}

interface RoomInfo {
  id: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  isDirect: boolean;
  lastMessage?: {
    content: string;
    timestamp: number;
    sender: string;
  };
  unreadCount: number;
}

export function RoomSidebar({ className }: RoomSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const { client } = useMatrix();
  const { rooms, isLoading, getRoomCategories } = useMatrixRooms();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { publicRooms, privateRooms, directMessages, myRooms } = getRoomCategories();

  // Debug logging for room categorization
  useEffect(() => {
    console.log('Room Sidebar Debug:', {
      allRooms: rooms.map(r => ({ id: r.id, name: r.name })),
      categorized: {
        public: publicRooms.map(r => ({ id: r.id, name: r.name })),
        private: privateRooms.map(r => ({ id: r.id, name: r.name })),
        direct: directMessages.map(r => ({ id: r.id, name: r.name })),
      },
    });
  }, [rooms, publicRooms, privateRooms, directMessages]);

  // Filter rooms based on search term
  const filteredRooms = {
    myRooms: myRooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase())),
    publicRooms: publicRooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    privateRooms: privateRooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    directMessages: directMessages.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  };

  // Navigate to room
  const handleRoomClick = async (roomId: string) => {
    const matrixRoom = client?.getRoom(roomId);

    // If room isn't in client yet (public room we haven't joined), try to join it first
    if (!matrixRoom) {
      console.log('Room not synced, attempting to join:', roomId);
      try {
        await client?.joinRoom(roomId);
        // Wait a moment for the room to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Try to get the room again after joining
        const joinedRoom = client?.getRoom(roomId);
        if (joinedRoom) {
          const encodedRoomId = encodeURIComponent(roomId);
          router.push(`/chat/${encodedRoomId}`);
        } else {
          console.warn('Room still not found after joining:', roomId);
        }
        return;
      } catch (error) {
        console.error('Failed to join room:', error);
        return;
      }
    }

    const membership = matrixRoom.getMyMembership();
    const joinRulesEvent = matrixRoom.currentState.getStateEvents('m.room.join_rules', '');
    const joinRule = Array.isArray(joinRulesEvent)
      ? joinRulesEvent[0]?.getContent().join_rule
      : joinRulesEvent?.getContent().join_rule;

    console.log('Room navigation attempt:', {
      roomId,
      membership,
      joinRule,
      room: {
        name: matrixRoom.name,
        isDirect: matrixRoom.getDMInviter() !== null,
        summary: matrixRoom.summary,
        joinRules: joinRulesEvent,
      },
    });

    // Allow navigation to joined rooms or public rooms
    if (membership === 'join' || joinRule === 'public') {
      const encodedRoomId = encodeURIComponent(roomId);
      router.push(`/chat/${encodedRoomId}`);
    } else {
      console.warn('Cannot navigate to inaccessible room:', {
        roomId,
        membership,
        joinRule,
      });
    }
  };

  return (
    <div className={cn('flex h-full w-64 flex-col border-r bg-background', className)}>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">Rooms</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsManagementOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create or join room</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative px-4 py-2">
        <Search className="absolute left-6 top-3.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search rooms..."
          className="w-full rounded-md border bg-background px-8 py-2 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {/* My Rooms */}
            {filteredRooms.myRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">My Rooms ({filteredRooms.myRooms.length})</h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.myRooms.map(room => (
                    <RoomItem
                      key={room.id}
                      room={room}
                      isActive={params.roomId === room.id}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public Rooms */}
            {filteredRooms.publicRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    Public Rooms ({filteredRooms.publicRooms.length})
                  </h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.publicRooms.map(room => (
                    <RoomItem
                      key={room.id}
                      room={room}
                      isActive={params.roomId === room.id}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Private Rooms */}
            {filteredRooms.privateRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    Private Rooms ({filteredRooms.privateRooms.length})
                  </h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.privateRooms.map(room => (
                    <RoomItem
                      key={room.id}
                      room={room}
                      isActive={params.roomId === room.id}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            {filteredRooms.directMessages.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    Direct Messages ({filteredRooms.directMessages.length})
                  </h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.directMessages.map(room => (
                    <RoomItem
                      key={room.id}
                      room={room}
                      isActive={params.roomId === room.id}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Rooms Message */}
            {!filteredRooms.myRooms.length &&
              !filteredRooms.publicRooms.length &&
              !filteredRooms.privateRooms.length &&
              !filteredRooms.directMessages.length && (
                <div className="flex flex-col items-center justify-center space-y-2 p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No rooms found</div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Try a different search term'
                      : 'Create or join a room to get started'}
                  </div>
                </div>
              )}
          </div>
        )}
      </ScrollArea>

      <div className="flex h-14 items-center justify-between border-t px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <RoomManagement
        className="fixed inset-y-0 left-64 z-50 w-96 border-r bg-background"
        isOpen={isManagementOpen}
        onOpenChange={setIsManagementOpen}
      />
    </div>
  );
}

// Room Item Component
function RoomItem({
  room,
  isActive,
  onClick,
}: {
  room: RoomInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-start space-y-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
        isActive && 'bg-muted'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={room.avatarUrl} />
                <AvatarFallback>
                  {room.isDirect ? (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    room.name.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">{room.name}</span>
              {room.unreadCount > 0 && (
                <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {room.unreadCount}
                </span>
              )}
            </div>
          </TooltipTrigger>
          {room.topic && <TooltipContent>{room.topic}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
      {room.lastMessage && (
        <div className="flex w-full items-center space-x-2 pl-8">
          <span className="truncate text-xs text-muted-foreground">{room.lastMessage.content}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Date(room.lastMessage.timestamp).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
    </button>
  );
}
