'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const router = useRouter();
  const { client } = useMatrix();
  const { rooms, isLoading } = useMatrixRooms();

  // Auto-redirect to first accessible room if available
  useEffect(() => {
    if (!isLoading && rooms.length > 0) {
      // Find first accessible room (joined or public)
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
        console.log('Auto-selecting accessible room:', {
          roomId: accessibleRoom.id,
          name: accessibleRoom.name,
        });
        router.replace(`/chat/${accessibleRoom.id}`);
      }
    }
  }, [isLoading, rooms, router, client]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Welcome to Matrix Chat</h2>
        <p className="mt-2 text-muted-foreground">
          {isLoading
            ? 'Loading rooms...'
            : rooms.length === 0
              ? 'Create or join a room to start chatting'
              : 'Redirecting to chat...'}
        </p>
      </div>
    </div>
  );
}
