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

export function RoomSidebar({ className }: RoomSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const { client } = useMatrix();
  const { rooms, isLoading, getRoomCategories } = useMatrixRooms();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { publicRooms, privateRooms, directMessages } = getRoomCategories();

  // Filter rooms based on search term
  const filteredRooms = {
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
  const handleRoomClick = (roomId: string) => {
    const matrixRoom = client?.getRoom(roomId);
    if (!matrixRoom) return;

    const membership = matrixRoom.getMyMembership();
    const joinRulesEvent = matrixRoom.currentState.getStateEvents('m.room.join_rules', '');
    const joinRule = Array.isArray(joinRulesEvent)
      ? joinRulesEvent[0]?.getContent().join_rule
      : joinRulesEvent?.getContent().join_rule;

    // Only allow navigating to joined rooms or public rooms
    if (membership === 'join' || joinRule === 'public') {
      const encodedRoomId = encodeURIComponent(roomId);
      console.log('Room navigation:', { roomId, encodedRoomId, membership, joinRule });
      router.push(`/chat/${encodedRoomId}`);
    } else {
      console.log('Cannot navigate to inaccessible room:', { roomId, membership, joinRule });
    }
  };

  // Auto-select first accessible room if none selected
  useEffect(() => {
    if (!params.roomId && rooms.length > 0 && !isLoading) {
      // Find first accessible room
      const accessibleRoom = rooms.find(room => {
        const matrixRoom = client?.getRoom(room.id);
        if (!matrixRoom) return false;

        const membership = matrixRoom.getMyMembership();
        const joinRulesEvent = matrixRoom.currentState.getStateEvents('m.room.join_rules', '');
        const joinRule = Array.isArray(joinRulesEvent)
          ? joinRulesEvent[0]?.getContent().join_rule
          : joinRulesEvent?.getContent().join_rule;

        return membership === 'join' || joinRule === 'public';
      });

      if (accessibleRoom) {
        handleRoomClick(accessibleRoom.id);
      }
    }
  }, [params.roomId, rooms, isLoading, client, handleRoomClick]);

  // Debug logging for available rooms
  useEffect(() => {
    console.log('Room Sidebar Debug:', {
      availableRooms: rooms.map(r => ({ id: r.id, name: r.name })),
      currentRoomId: params.roomId ? decodeURIComponent(params.roomId as string) : null,
      categories: {
        public: publicRooms.map(r => ({ id: r.id, name: r.name })),
        private: privateRooms.map(r => ({ id: r.id, name: r.name })),
        direct: directMessages.map(r => ({ id: r.id, name: r.name })),
      },
    });
  }, [rooms, params.roomId, publicRooms, privateRooms, directMessages]);

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
            {/* Public Rooms */}
            {filteredRooms.publicRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Public Rooms</h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.publicRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className={cn(
                        'flex w-full flex-col items-start space-y-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
                        params.roomId === room.id && 'bg-muted'
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
                          <span className="truncate text-xs text-muted-foreground">
                            {room.lastMessage.content}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(room.lastMessage.timestamp).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Private Rooms */}
            {filteredRooms.privateRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Private Rooms</h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.privateRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className={cn(
                        'flex w-full flex-col items-start space-y-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
                        params.roomId === room.id && 'bg-muted'
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
                          <span className="truncate text-xs text-muted-foreground">
                            {room.lastMessage.content}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(room.lastMessage.timestamp).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            {filteredRooms.directMessages.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Direct Messages</h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredRooms.directMessages.map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className={cn(
                        'flex w-full flex-col items-start space-y-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
                        params.roomId === room.id && 'bg-muted'
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
                          <span className="truncate text-xs text-muted-foreground">
                            {room.lastMessage.content}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(room.lastMessage.timestamp).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
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
