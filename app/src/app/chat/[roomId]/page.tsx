'use client';

import { ChatContainer } from '@/components/chat/chat-container';
import { MemberList } from '@/components/chat/member-list';
import { RoomInfo } from '@/components/chat/room-info';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Info, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ChatPageProps {
  params: {
    roomId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const { client, isInitialized } = useMatrix();
  const { rooms, isLoading } = useMatrixRooms();
  const [room, setRoom] = useState<any>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Decode room ID
  const decodedRoomId = decodeURIComponent(params.roomId);

  // Debug logging
  useEffect(() => {
    console.log('Chat Page Debug:', {
      encodedRoomId: params.roomId,
      decodedRoomId,
      isInitialized,
      isLoading,
      clientExists: !!client,
      availableRooms: rooms.map(r => ({ id: r.id, name: r.name })),
      currentRoom: room,
    });
  }, [params.roomId, decodedRoomId, isInitialized, isLoading, client, rooms, room]);

  // Find room details
  useEffect(() => {
    if (!isInitialized || !client) {
      console.log('Matrix not ready:', { isInitialized, clientExists: !!client });
      return;
    }

    const currentRoom = client.getRoom(decodedRoomId);
    console.log('Room lookup:', {
      encodedRoomId: params.roomId,
      decodedRoomId,
      roomFound: !!currentRoom,
      membership: currentRoom?.getMyMembership(),
      roomState: currentRoom?.currentState,
      allRooms: client.getRooms().map(r => ({ id: r.roomId, name: r.name })),
    });

    if (currentRoom && currentRoom.getMyMembership() === 'join') {
      const roomInfo = rooms.find(r => r.id === decodedRoomId);
      console.log('Room info:', {
        roomInfoFound: !!roomInfo,
        roomInfo,
      });

      if (roomInfo) {
        setRoom(roomInfo);
      } else {
        console.log('Room info not found in rooms list');
      }
    } else {
      console.log('Room not accessible, redirecting to /chat');
      router.replace('/chat');
    }
  }, [isInitialized, client, rooms, params.roomId, decodedRoomId, router]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    console.log('Showing loading state:', { isInitialized, isLoading });
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!room) {
    console.log('Showing room not found state');
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Room not found</h2>
          <p className="mt-2 text-muted-foreground">
            The room you're looking for doesn't exist or you don't have access to it
          </p>
        </div>
      </div>
    );
  }

  console.log('Rendering room:', {
    encodedRoomId: params.roomId,
    decodedRoomId,
    roomName: room.name,
    roomTopic: room.topic,
  });

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Room Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">{room.name}</h2>
            {room.topic && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <p className="text-sm text-muted-foreground">{room.topic}</p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMembers(!showMembers)}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1">
          <ChatContainer key={decodedRoomId} roomId={decodedRoomId} />
        </div>
      </div>

      {/* Members Sidebar */}
      <aside
        className={cn(
          'w-64 border-l bg-background transition-all duration-300',
          !showMembers && 'hidden'
        )}
      >
        <header className="flex h-14 items-center justify-between border-b px-4">
          <h3 className="font-semibold">Members</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowMembers(false)}
          >
            <Users className="h-4 w-4" />
          </Button>
        </header>
        <MemberList roomId={decodedRoomId} />
      </aside>

      {/* Room Info Sidebar */}
      {showInfo && (
        <RoomInfo
          roomId={decodedRoomId}
          className="w-80 border-l"
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}
