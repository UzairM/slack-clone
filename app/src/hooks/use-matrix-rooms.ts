import { useMatrix } from '@/hooks/use-matrix';
import {
  ClientEvent,
  EventType,
  MatrixEvent,
  Preset,
  Room,
  RoomEvent,
  Visibility,
} from 'matrix-js-sdk';
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

interface PublicRoomInfo {
  id: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  memberCount: number;
  worldReadable: boolean;
  guestCanJoin: boolean;
}

export function useMatrixRooms() {
  const { client, isInitialized } = useMatrix();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);
  const [publicRoomsError, setPublicRoomsError] = useState<string | null>(null);

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

  // Create a direct message room
  const createDirectMessage = async (userId: string) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      // Check if a DM room already exists with this user
      const existingRooms = client.getRooms();
      const existingDM = existingRooms.find(room => {
        const isDM = room.getDMInviter() === userId;
        const members = room.getJoinedMembers();
        return isDM && members.length === 2 && members.some(m => m.userId === userId);
      });

      if (existingDM) {
        return existingDM.roomId;
      }

      // Create a new DM room
      const result = await client.createRoom({
        preset: Preset.TrustedPrivateChat,
        visibility: Visibility.Private,
        invite: [userId],
        is_direct: true,
        initial_state: [
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: {
              guest_access: 'can_join',
            },
          },
        ],
      });

      // Set room name to the other user's display name
      const otherUser = await client.getUser(userId);
      if (otherUser) {
        await client.setRoomName(result.room_id, otherUser.displayName || userId);
      }

      return result.room_id;
    } catch (error: any) {
      console.error('Failed to create direct message:', error);
      throw new Error(error.message || 'Failed to create direct message');
    }
  };

  // Create a private room with invites
  const createPrivateRoom = async (
    name: string,
    inviteUserIds: string[] = [],
    avatarUrl?: string
  ) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      const result = await client.createRoom({
        name,
        preset: Preset.TrustedPrivateChat,
        visibility: Visibility.Private,
        invite: inviteUserIds,
        initial_state: [
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: {
              guest_access: 'forbidden',
            },
          },
          {
            type: 'm.room.history_visibility',
            state_key: '',
            content: {
              history_visibility: 'shared',
            },
          },
          ...(avatarUrl
            ? [
                {
                  type: 'm.room.avatar',
                  state_key: '',
                  content: {
                    url: avatarUrl,
                  },
                },
              ]
            : []),
        ],
      });

      return result.room_id;
    } catch (error: any) {
      console.error('Failed to create private room:', error);
      throw new Error(error.message || 'Failed to create private room');
    }
  };

  // Create a public room
  const createPublicRoom = async (name: string, topic?: string, avatarUrl?: string) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      // Log the client state
      console.log('Matrix Client State:', {
        baseUrl: client.baseUrl,
        isLoggedIn: client.isLoggedIn(),
        userId: client.getUserId(),
        accessToken: client.getAccessToken()?.slice(0, 10) + '...', // Log partial token for debugging
      });

      // Create room with correct preset and visibility
      const createRoomOptions = {
        name,
        topic,
        visibility: 'public' as Visibility,
        preset: 'public_chat' as Preset,
        room_alias_name: name.toLowerCase().replace(/\s+/g, '-'),
        creation_content: {
          'm.federate': true,
        },
        initial_state: [
          {
            type: 'm.room.join_rules',
            state_key: '',
            content: {
              join_rule: 'public',
            },
          },
          {
            type: 'm.room.history_visibility',
            state_key: '',
            content: {
              history_visibility: 'world_readable',
            },
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: {
              guest_access: 'can_join',
            },
          },
          {
            type: 'm.room.name',
            state_key: '',
            content: {
              name,
            },
          },
          {
            type: 'm.room.visibility',
            state_key: '',
            content: {
              visibility: 'public',
            },
          },
        ],
        // Set power levels to ensure proper permissions
        power_level_content_override: {
          users_default: 0,
          events_default: 0,
          state_default: 50,
          ban: 50,
          kick: 50,
          redact: 50,
          invite: 0,
        },
      };

      console.log('Creating public room with options:', JSON.stringify(createRoomOptions, null, 2));

      // Create the room
      const result = await client.createRoom(createRoomOptions);
      console.log('Room creation result:', result);

      // Wait for room state to be properly set
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the room and verify its state
      const room = client.getRoom(result.room_id);
      if (!room) {
        throw new Error('Room not found after creation');
      }

      // Get state events
      const getStateEvent = (eventType: string) => {
        const events = room.currentState.getStateEvents(eventType, '');
        if (Array.isArray(events) && events.length > 0) {
          return events[0];
        }
        return events;
      };

      // Log room state for debugging
      const roomState = {
        roomId: result.room_id,
        name: room.name,
        canonicalAlias: room.getCanonicalAlias(),
        joinRule: getStateEvent('m.room.join_rules')?.getContent(),
        historyVisibility: getStateEvent('m.room.history_visibility')?.getContent(),
        guestAccess: getStateEvent('m.room.guest_access')?.getContent(),
        visibility: getStateEvent('m.room.visibility')?.getContent(),
      };

      console.log('Room state after creation:', roomState);

      // If room name is not set correctly, set it explicitly
      if (room.name !== name) {
        console.log('Setting room name explicitly...');
        await client.sendStateEvent(
          result.room_id,
          'm.room.name' as EventType,
          {
            name: name,
          },
          ''
        );

        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify name update
        const updatedRoom = client.getRoom(result.room_id);
        console.log('Room name after explicit update:', updatedRoom?.name);
      }

      // Force an immediate room list update
      await updateRooms();

      return result.room_id;
    } catch (error: any) {
      console.error('Failed to create public room:', error);
      throw new Error(error.message || 'Failed to create public room');
    }
  };

  // Get room categories
  const getRoomCategories = useCallback(() => {
    if (!rooms.length) return { publicRooms: [], privateRooms: [], directMessages: [] };

    // Temporarily log the access token
    console.log('Current access token:', client?.getAccessToken());

    return rooms.reduce(
      (acc, room) => {
        const matrixRoom = client?.getRoom(room.id);
        if (!matrixRoom) {
          console.warn('Room not found in Matrix client:', room.id);
          return acc;
        }

        // Get room state events
        const joinRulesEvent = matrixRoom.currentState.getStateEvents('m.room.join_rules', '');
        const visibilityEvent = matrixRoom.currentState.getStateEvents('m.room.visibility', '');
        const createEvent = matrixRoom.currentState.getStateEvents('m.room.create', '');

        // Get content from state events
        const getEventContent = (event: MatrixEvent | MatrixEvent[] | null) => {
          if (Array.isArray(event) && event.length > 0) {
            return event[0].getContent();
          }
          if (event && !Array.isArray(event)) {
            return event.getContent();
          }
          return null;
        };

        const joinRule = getEventContent(joinRulesEvent)?.join_rule;
        const visibility = getEventContent(visibilityEvent)?.visibility;
        const isDirect = getEventContent(createEvent)?.is_direct === true;

        console.log('Room categorization details:', {
          roomId: room.id,
          roomName: room.name,
          joinRule,
          visibility,
          isDirect,
          createEvent: getEventContent(createEvent),
          stateEvents: {
            joinRules: !!joinRulesEvent,
            visibility: !!visibilityEvent,
            create: !!createEvent,
          },
        });

        // Categorize room
        if (isDirect) {
          acc.directMessages.push(room);
        } else if (joinRule === 'public' || visibility === 'public') {
          acc.publicRooms.push(room);
        } else {
          acc.privateRooms.push(room);
        }

        return acc;
      },
      {
        publicRooms: [] as RoomInfo[],
        privateRooms: [] as RoomInfo[],
        directMessages: [] as RoomInfo[],
      }
    );
  }, [rooms, client]);

  // Update rooms list
  const updateRooms = useCallback(async () => {
    if (!client) return;

    try {
      // Get joined rooms
      const joinedRooms = client.getRooms();
      const joinedRoomInfos = joinedRooms
        .filter(room => room.getMyMembership() === 'join')
        .map(convertRoom);

      // Get available public rooms
      const publicRoomsResponse = await client.publicRooms({
        limit: 50,
      });

      // Convert public rooms to RoomInfo format
      const publicRoomInfos: RoomInfo[] = publicRoomsResponse.chunk
        .filter(room => !joinedRoomInfos.some(joined => joined.id === room.room_id))
        .map(room => ({
          id: room.room_id,
          name: room.name || room.room_id,
          topic: room.topic,
          avatarUrl: room.avatar_url
            ? client.mxcUrlToHttp(room.avatar_url, 96, 96, 'crop') || undefined
            : undefined,
          isDirect: false,
          unreadCount: 0,
          lastMessage: undefined,
        }));

      // Combine and sort rooms
      const allRooms = [...joinedRoomInfos, ...publicRoomInfos].sort((a, b) => {
        // Sort by last message timestamp (most recent first)
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });

      setRooms(allRooms);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to update rooms:', error);
      setIsLoading(false);
    }
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
    const onRoomEvent = () => {
      console.log('Room event triggered, updating rooms...');
      updateRooms();
    };
    const onRoomTimeline = (event: MatrixEvent) => {
      // Only update for message events
      if (event.getType() === 'm.room.message') {
        console.log('New message received, updating rooms...');
        updateRooms();
      }
    };

    // Listen for all relevant room events
    client.on(ClientEvent.Room, onRoomEvent);
    client.on(RoomEvent.Timeline, onRoomTimeline);
    client.on(RoomEvent.MyMembership, onRoomEvent);

    return () => {
      client.removeListener(ClientEvent.Room, onRoomEvent);
      client.removeListener(RoomEvent.Timeline, onRoomTimeline);
      client.removeListener(RoomEvent.MyMembership, onRoomEvent);
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

  // Search public rooms
  const searchPublicRooms = async (searchTerm?: string, limit = 20) => {
    if (!client) throw new Error('Matrix client not initialized');

    try {
      setIsLoadingPublicRooms(true);
      setPublicRoomsError(null);

      const response = await client.publicRooms({
        limit,
        filter: {
          generic_search_term: searchTerm,
        },
      });

      const publicRoomInfos = response.chunk.map(room => ({
        id: room.room_id,
        name: room.name || room.room_id,
        topic: room.topic,
        avatarUrl:
          (room.avatar_url && client.mxcUrlToHttp(room.avatar_url, 96, 96, 'crop')) || undefined,
        memberCount: room.num_joined_members,
        worldReadable: room.world_readable,
        guestCanJoin: room.guest_can_join,
      }));

      setPublicRooms(publicRoomInfos);
      return publicRoomInfos;
    } catch (error: any) {
      console.error('Failed to search public rooms:', error);
      const errorMessage = error.message || 'Failed to search public rooms';
      setPublicRoomsError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingPublicRooms(false);
    }
  };

  return {
    rooms,
    isLoading,
    createRoom,
    createDirectMessage,
    createPrivateRoom,
    createPublicRoom,
    joinRoom,
    leaveRoom,
    publicRooms,
    isLoadingPublicRooms,
    publicRoomsError,
    searchPublicRooms,
    getRoomCategories,
  };
}
