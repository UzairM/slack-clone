'use client';

import { AvatarWithPresence } from '@/components/chat/avatar-with-presence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Hash, Lock, MessageSquare, X } from 'lucide-react';
import { Direction } from 'matrix-js-sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RoomInfoProps {
  roomId: string;
  className?: string;
  onClose?: () => void;
}

export function RoomInfo({ roomId, className, onClose }: RoomInfoProps) {
  const router = useRouter();
  const { client } = useMatrix();
  const { rooms, leaveRoom } = useMatrixRooms();
  const [room, setRoom] = useState<any>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Find room details and check admin status
  useEffect(() => {
    if (!client || rooms.length === 0) return;

    const currentRoom = rooms.find(r => r.id === roomId);
    if (currentRoom) {
      setRoom(currentRoom);

      // Check if user is admin
      const matrixRoom = client.getRoom(roomId);
      if (matrixRoom) {
        const userId = client.getUserId();
        const powerLevel = matrixRoom.getMember(userId!)?.powerLevel || 0;
        setIsAdmin(powerLevel >= 100);
      }
    }
  }, [client, rooms, roomId]);

  const handleLeaveRoom = async () => {
    try {
      setIsLeaving(true);
      await leaveRoom(roomId);
      toast.success('Left room successfully');
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave room');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (
      !client ||
      !window.confirm('Are you sure you want to delete this room? This action cannot be undone.')
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const matrixRoom = client.getRoom(roomId);

      // Delete all state events
      await client.sendStateEvent(roomId, 'm.room.tombstone' as any, {
        body: 'This room has been deleted',
        replacement_room: '',
      });

      // Kick all members
      const members = matrixRoom?.getJoinedMembers() || [];
      for (const member of members) {
        if (member.userId !== client.getUserId()) {
          await client.kick(roomId, member.userId, 'Room deleted by admin');
        }
      }

      // Leave the room and navigate
      await leaveRoom(roomId);
      onClose?.(); // Close the room info panel
      router.push('/chat'); // Use push instead of replace
      router.refresh(); // Force refresh the router

      toast.success('Room deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      toast.error(error.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCreationTimestamp = () => {
    const matrixRoom = client?.getRoom(roomId);
    if (!matrixRoom) return 0;

    const timeline = matrixRoom.getLiveTimeline();
    const state = timeline.getState(Direction.Forward);
    const createEvent = state?.getStateEvents('m.room.create')[0];
    return createEvent?.getTs() || 0;
  };

  if (!room) {
    return null;
  }

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <header className="flex h-14 items-center justify-between border-b px-4">
        <h3 className="font-semibold">Room Info</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* Room Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {room.isDirect ? (
                <AvatarWithPresence
                  userId={room.id}
                  avatarUrl={room.avatarUrl}
                  displayName={room.name}
                  className="h-20 w-20"
                />
              ) : (
                <Avatar className="h-20 w-20">
                  <AvatarImage src={room.avatarUrl} />
                  <AvatarFallback>
                    {room.isDirect ? (
                      <MessageSquare className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      room.name.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  {room.isDirect ? (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  ) : room.isPublic ? (
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h2 className="text-xl font-semibold">{room.name}</h2>
                </div>
                {room.topic && <p className="mt-1 text-sm text-muted-foreground">{room.topic}</p>}
              </div>
            </div>

            <Separator />

            {/* Room Stats */}
            <div className="space-y-2">
              <h4 className="font-medium">About</h4>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(getCreationTimestamp()).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="font-medium">
                    {client?.getRoom(roomId)?.getJoinedMembers().length}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Room Actions */}
            <div className="space-y-2">
              <h4 className="font-medium">Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLeaveRoom}
                  disabled={isLeaving || isDeleting}
                >
                  Leave Room
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteRoom}
                    disabled={isLeaving || isDeleting}
                  >
                    Delete Room
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
