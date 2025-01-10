'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const router = useRouter();
  const { client } = useMatrix();
  const { rooms, isLoading } = useMatrixRooms();

  // Auto-redirect to first room user is a member of
  useEffect(() => {
    if (!isLoading && rooms.length > 0) {
      const joinedRoom = rooms.find(room => {
        const matrixRoom = client?.getRoom(room.id);
        return matrixRoom?.getMyMembership() === 'join';
      });

      if (joinedRoom) {
        console.log('Auto-selecting joined room:', {
          roomId: joinedRoom.id,
          name: joinedRoom.name,
        });
        router.replace(`/chat/${joinedRoom.id}`);
      }
    }
  }, [isLoading, rooms, router, client]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Welcome to Matrix Chat</h2>
        <p className="mt-2 text-muted-foreground">
          {isLoading ? 'Loading rooms...' : 'Select a room from the sidebar to start chatting'}
        </p>
      </div>
    </div>
  );
}
