'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Loader2, Lock, MessageSquare, Plus, Search, Settings, Users } from 'lucide-react';
import { NotificationCountType, RoomEvent } from 'matrix-js-sdk';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RoomManagement } from './room-management';

interface RoomSidebarProps {
  className?: string;
}

interface RoomInfo {
  id: string;
  name: string;
  topic?: string;
  avatarUrl: string;
  isDirect: boolean;
  lastMessage?: {
    content: string;
    timestamp: number;
    sender: string;
  };
  unreadCount: number;
}

interface UserInfo {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export function RoomSidebar({ className }: RoomSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const { client } = useMatrix();
  const { rooms, isLoading, getRoomCategories, createDirectMessage } = useMatrixRooms();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);

  const { publicRooms, privateRooms, directMessages, myRooms } = getRoomCategories();

  // Load all users from the server
  const loadAllUsers = useCallback(async () => {
    if (!client) return;

    try {
      setIsSearchingUsers(true);
      const serverName = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME || 'localhost';

      // Search with empty string to get all users
      const searchResults = await client.searchUserDirectory({
        term: '' + serverName,
        limit: 100, // Adjust this number based on your needs
      });

      const userResults = searchResults.results.map(user => ({
        userId: user.user_id,
        displayName: user.display_name,
        avatarUrl: (user.avatar_url && client.mxcUrlToHttp(user.avatar_url)) || undefined,
      }));

      setUsers(userResults);
      setFilteredUsers(userResults);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsSearchingUsers(false);
    }
  }, [client]);

  // Load users on component mount
  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Search users in directory
  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setFilteredUsers(users);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = users.filter(
        user =>
          user.displayName?.toLowerCase().includes(lowerQuery) ||
          user.userId.toLowerCase().includes(lowerQuery)
      );
      setFilteredUsers(filtered);
    },
    [users]
  );

  // Handle search input changes
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      searchUsers(value);
    },
    [searchUsers]
  );

  // Start DM with user
  const handleStartDM = useCallback(
    async (userId: string) => {
      if (!client) {
        toast.error('Chat client not initialized');
        return;
      }

      try {
        toast.loading('Starting conversation...');

        // Check if we already have a DM with this user
        const existingRooms = client.getRooms();
        const existingDM = existingRooms.find(room => {
          // Get room members
          const members = room.getJoinedMembers();

          // Check if this is a DM room with exactly 2 members
          if (members.length !== 2) return false;

          // Check if the room is marked as direct messaging
          const createEvent = room.currentState.getStateEvents('m.room.create', '');
          const isDM = Array.isArray(createEvent)
            ? createEvent[0]?.getContent().is_direct
            : createEvent?.getContent().is_direct;

          if (!isDM) return false;

          // Check if the room contains both the current user and the target user
          const hasCurrentUser = members.some(m => m.userId === client.getUserId());
          const hasTargetUser = members.some(m => m.userId === userId);

          return hasCurrentUser && hasTargetUser;
        });

        let roomId;
        if (existingDM) {
          roomId = existingDM.roomId;
          toast.dismiss();
          toast.success('Opening existing conversation');
        } else {
          // Create new DM room
          roomId = await createDirectMessage(userId);
          toast.dismiss();
          toast.success('Started new conversation');
        }

        // Wait a moment for the room to sync
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to the room
        const encodedRoomId = encodeURIComponent(roomId);
        router.push(`/chat/${encodedRoomId}`);
      } catch (error) {
        console.error('Failed to start DM:', error);
        toast.dismiss();
        toast.error('Failed to start conversation');
      }
    },
    [client, createDirectMessage, router]
  );

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
    if (!client) return;

    try {
      // Handle room invites
      if (matrixRoom?.getMyMembership() === 'invite') {
        toast.loading('Accepting invitation...');
        await client.joinRoom(roomId);
        toast.dismiss();
        toast.success('Invitation accepted');

        // Wait a moment for the room to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        const encodedRoomId = encodeURIComponent(roomId);
        router.push(`/chat/${encodedRoomId}`);
        return;
      }

      // If room isn't in client yet or we've left it, try to join it
      if (!matrixRoom || matrixRoom.getMyMembership() === 'leave') {
        toast.loading('Joining room...');
        await client.joinRoom(roomId);
        toast.dismiss();
        toast.success('Joined room');

        // Wait a moment for the room to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        const encodedRoomId = encodeURIComponent(roomId);
        router.push(`/chat/${encodedRoomId}`);
        return;
      }

      const membership = matrixRoom.getMyMembership();
      const joinRule = matrixRoom.getJoinRule();

      // Allow navigation to joined rooms or public rooms
      if (membership === 'join' || joinRule === 'public') {
        const encodedRoomId = encodeURIComponent(roomId);
        router.push(`/chat/${encodedRoomId}`);
      }
    } catch (error) {
      console.error('Failed to handle room action:', error);
      toast.dismiss();
      toast.error('Failed to join room');
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
          placeholder="Search rooms or users..."
          className="w-full rounded-md border bg-background px-8 py-2 text-sm"
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoading || isSearchingUsers ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {/* Room Invites */}
            {filteredRooms.privateRooms.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    Room Invites ({filteredRooms.privateRooms.length})
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

            {/* Users Section */}
            {filteredUsers.length > 0 && (
              <div>
                <div className="mb-2 flex items-center px-2">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">All Users ({filteredUsers.length})</h3>
                </div>
                <div className="space-y-[2px]">
                  {filteredUsers.map(user => (
                    <button
                      key={user.userId}
                      onClick={() => handleStartDM(user.userId)}
                      className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-[#AACFF3]/40 dark:hover:bg-muted/50"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user.avatarUrl} alt={user.displayName || user.userId} />
                        <AvatarFallback>
                          {(user.displayName || user.userId.charAt(1)).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate font-medium">
                          {user.displayName || user.userId.split(':')[0].substring(1)}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.userId}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!filteredRooms.myRooms.length &&
              !filteredRooms.publicRooms.length &&
              !filteredRooms.privateRooms.length &&
              !filteredRooms.directMessages.length &&
              !filteredUsers.length && (
                <div className="flex flex-col items-center justify-center space-y-2 p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No results found</div>
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
        className="fixed inset-y-0 left-64 z-40 w-96 border-r bg-background"
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
  const { client } = useMatrix();
  const matrixRoom = client?.getRoom(room.id);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasHighlight, setHasHighlight] = useState(false);
  const [lastMessage, setLastMessage] = useState(room.lastMessage);

  // Update room state
  useEffect(() => {
    if (!matrixRoom) return;

    const updateRoomState = () => {
      // Get unread notification counts using Matrix SDK's notification state
      const notifState = matrixRoom.getUnreadNotificationCount(NotificationCountType.Total);
      const highlightState = matrixRoom.getUnreadNotificationCount(NotificationCountType.Highlight);

      setUnreadCount(notifState || 0);
      setHasHighlight(!!highlightState);

      // Update last message
      const timeline = matrixRoom.getLiveTimeline();
      const events = timeline.getEvents();
      const lastMessageEvent = events
        .slice()
        .reverse()
        .find(
          event =>
            event.getType() === 'm.room.message' && !event.isRedacted() && event.getContent()?.body
        );

      if (lastMessageEvent) {
        setLastMessage({
          content: lastMessageEvent.getContent()?.body || '',
          timestamp: lastMessageEvent.getTs(),
          sender: lastMessageEvent.getSender() || '',
        });
      }
    };

    // Initial update
    updateRoomState();

    // Listen for room events
    const handleTimelineEvent = () => {
      updateRoomState();
    };

    const handleReceiptEvent = () => {
      updateRoomState();
    };

    matrixRoom.on(RoomEvent.Timeline, handleTimelineEvent);
    matrixRoom.on(RoomEvent.Receipt, handleReceiptEvent);
    matrixRoom.on(RoomEvent.Redaction, updateRoomState);
    matrixRoom.on(RoomEvent.LocalEchoUpdated, updateRoomState);

    return () => {
      matrixRoom.removeListener(RoomEvent.Timeline, handleTimelineEvent);
      matrixRoom.removeListener(RoomEvent.Receipt, handleReceiptEvent);
      matrixRoom.removeListener(RoomEvent.Redaction, updateRoomState);
      matrixRoom.removeListener(RoomEvent.LocalEchoUpdated, updateRoomState);
    };
  }, [matrixRoom, room.id, room.name]);

  // Get current unread state using Matrix SDK's notification state
  const currentUnreadCount =
    matrixRoom?.getUnreadNotificationCount(NotificationCountType.Total) || 0;
  const currentHighlightCount =
    matrixRoom?.getUnreadNotificationCount(NotificationCountType.Highlight) || 0;

  // Use the most up-to-date count
  const displayUnreadCount = Math.max(unreadCount, currentUnreadCount);
  const displayHasHighlight = hasHighlight || !!currentHighlightCount;

  return (
    <button
      onClick={onClick}
      key={`${room.id}-${displayUnreadCount}-${displayHasHighlight}`}
      className={cn(
        'group relative flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-[#AACFF3]/40 dark:hover:bg-muted/50',
        isActive && 'bg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0 transition-transform group-hover:scale-105">
                <AvatarImage src={room.avatarUrl} alt={room.name} />
                <AvatarFallback className="text-base font-medium">
                  {room.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <div className="flex w-full items-center gap-2 relative">
                  <span className="truncate font-medium leading-none">{room.name}</span>
                </div>
                {lastMessage && (
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate text-xs text-muted-foreground/80">
                        {lastMessage.content}
                      </span>
                      {displayUnreadCount > 0 ? (
                        <span
                          className={cn(
                            'flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-medium',
                            displayHasHighlight
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-primary text-primary-foreground'
                          )}
                        >
                          {displayUnreadCount}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
                      {new Date(lastMessage.timestamp).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          {room.topic && <TooltipContent>{room.topic}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </button>
  );
}
