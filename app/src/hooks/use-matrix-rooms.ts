import { useMatrix } from '@/hooks/use-matrix';
import { ClientEvent, MatrixEvent, Preset, Room, RoomEvent, Visibility } from 'matrix-js-sdk';
import { useCallback, useEffect, useState } from 'react';

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

export function useMatrixRooms() {
  const { client, isInitialized } = useMatrix();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Matrix room to RoomInfo
  const convertRoom = useCallback(
    (room: Room): RoomInfo => {
      const timeline = room.getLiveTimeline().getEvents();
      const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null;
      const isDirect = room.getDMInviter() !== null;
      const topicEvent = room.currentState.getStateEvents('m.room.topic', '') || [];
      const topic = Array.isArray(topicEvent)
        ? (topicEvent[0] as MatrixEvent)?.getContent().topic
        : (topicEvent as MatrixEvent)?.getContent().topic;

      return {
        id: room.roomId,
        name: room.name,
        topic,
        avatarUrl: room.getAvatarUrl(client?.baseUrl || '', 96, 96, 'crop') || undefined,
        isDirect,
        lastMessage: lastEvent
          ? {
              content:
                lastEvent.getContent().body ||
                (lastEvent.getContent().msgtype === 'm.image' ? '📷 Image' : 'Message'),
              timestamp: lastEvent.getTs(),
              sender: lastEvent.getSender() || '',
            }
          : undefined,
        unreadCount: room.getUnreadNotificationCount(),
      };
    },
    [client]
  );

  // Update rooms list
  const updateRooms = useCallback(() => {
    if (!client) return;

    const joinedRooms = client.getRooms();
    const roomInfos = joinedRooms
      .filter(room => room.getMyMembership() === 'join')
      .map(convertRoom)
      .sort((a, b) => {
        // Sort by last message timestamp (most recent first)
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });

    setRooms(roomInfos);
    setIsLoading(false);
  }, [client, convertRoom]);

  // Listen for room events
  useEffect(() => {
    if (!client || !isInitialized) {
      setIsLoading(true);
      return;
    }

    // Initial room list
    updateRooms();

    // Room events
    const onRoomEvent = () => updateRooms();
    const onRoomTimeline = (event: MatrixEvent) => {
      // Only update for message events
      if (event.getType() === 'm.room.message') {
        updateRooms();
      }
    };

    client.on(ClientEvent.Room, onRoomEvent);
    client.on(RoomEvent.Timeline, onRoomTimeline);

    return () => {
      client.removeListener(ClientEvent.Room, onRoomEvent);
      client.removeListener(RoomEvent.Timeline, onRoomTimeline);
    };
  }, [client, isInitialized, updateRooms]);

  // Room actions
  const createRoom = async (name: string, isDirect = false) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      const result = await client.createRoom({
        name,
        preset: (isDirect ? Preset.TrustedPrivateChat : Preset.PublicChat) as Preset,
        visibility: (isDirect ? Visibility.Private : Visibility.Public) as Visibility,
      });

      return result.room_id;
    } catch (error: any) {
      console.error('Failed to create room:', error);
      throw new Error(error.message || 'Failed to create room');
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      await client.joinRoom(roomId);
    } catch (error: any) {
      console.error('Failed to join room:', error);
      throw new Error(error.message || 'Failed to join room');
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      await client.leave(roomId);
    } catch (error: any) {
      console.error('Failed to leave room:', error);
      throw new Error(error.message || 'Failed to leave room');
    }
  };

  return {
    rooms,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
