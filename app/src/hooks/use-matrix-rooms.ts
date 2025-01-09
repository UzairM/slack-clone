import { useMatrix } from '@/hooks/use-matrix';
import {
  ClientEvent,
  MatrixEvent,
  Preset,
  Room,
  RoomEvent,
  SyncState,
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
    (room: Room, publicRoomInfo?: { name: string }): RoomInfo => {
      const timeline = room.getLiveTimeline().getEvents();
      const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null;
      const isDirect = room.getDMInviter() !== null;
      const topicEvent = room.currentState.getStateEvents('m.room.topic', '') || [];
      const topic = Array.isArray(topicEvent)
        ? (topicEvent[0] as MatrixEvent)?.getContent().topic
        : (topicEvent as MatrixEvent)?.getContent().topic;

      // Get room name from state event
      const nameEvent = room.currentState.getStateEvents('m.room.name', '');
      const nameFromState = Array.isArray(nameEvent)
        ? nameEvent[0]?.getContent().name
        : nameEvent?.getContent().name;

      // Get canonical alias
      const aliasEvent = room.currentState.getStateEvents('m.room.canonical_alias', '');
      const canonicalAlias = Array.isArray(aliasEvent)
        ? aliasEvent[0]?.getContent().alias
        : aliasEvent?.getContent().alias;

      // Use name in priority order
      const roomName =
        publicRoomInfo?.name ||
        nameFromState ||
        room.name ||
        (canonicalAlias ? canonicalAlias.split(':')[0].substring(1) : null) ||
        'Unnamed Room';

      return {
        id: room.roomId,
        name: roomName,
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
      const createRoomOptions = {
        name,
        topic,
        visibility: Visibility.Public,
        preset: Preset.PublicChat,
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
        ],
      };

      // Create the room
      const result = await client.createRoom(createRoomOptions);

      // Set room name
      await client.setRoomName(result.room_id, name);

      // Publish to directory
      await client.setRoomDirectoryVisibility(result.room_id, Visibility.Public);

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
    if (!rooms.length)
      return {
        publicRooms: [],
        privateRooms: [],
        directMessages: [],
        myRooms: [],
      };

    return rooms.reduce(
      (acc, room) => {
        const matrixRoom = client?.getRoom(room.id);

        if (!matrixRoom) {
          acc.publicRooms.push(room);
          return acc;
        }

        const joinRulesEvent = matrixRoom.currentState.getStateEvents('m.room.join_rules', '');
        const visibilityEvent = matrixRoom.currentState.getStateEvents('m.room.visibility', '');
        const createEvent = matrixRoom.currentState.getStateEvents('m.room.create', '');

        const joinRule = Array.isArray(joinRulesEvent)
          ? joinRulesEvent[0]?.getContent().join_rule
          : joinRulesEvent?.getContent().join_rule;
        const visibility = Array.isArray(visibilityEvent)
          ? visibilityEvent[0]?.getContent().visibility
          : visibilityEvent?.getContent().visibility;
        const isDirect = Array.isArray(createEvent)
          ? createEvent[0]?.getContent().is_direct === true
          : createEvent?.getContent().is_direct === true;

        const membership = matrixRoom.getMyMembership();

        if (isDirect) {
          acc.directMessages.push(room);
        } else if (membership === 'join') {
          acc.myRooms.push(room);
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
        myRooms: [] as RoomInfo[],
      }
    );
  }, [rooms, client]);

  // Update rooms list - now with optimized filtering
  const updateRooms = useCallback(async () => {
    if (!client) return;

    try {
      const allKnownRooms = client.getRooms();

      // Get all rooms the user has access to
      const accessibleRoomInfos = allKnownRooms
        .filter(room => {
          const membership = room.getMyMembership();
          const joinRulesEvent = room.currentState.getStateEvents('m.room.join_rules', '');
          const joinRule = Array.isArray(joinRulesEvent)
            ? joinRulesEvent[0]?.getContent().join_rule
            : joinRulesEvent?.getContent().join_rule;

          // Include rooms user is part of or public rooms
          return membership === 'join' || membership === 'invite' || joinRule === 'public';
        })
        .map(room => convertRoom(room));

      // Fetch public rooms if we're in a prepared state
      let publicRoomInfos: RoomInfo[] = [];
      if (client.getSyncState() === SyncState.Prepared) {
        try {
          const serverUrl = new URL(client.baseUrl);
          const serverName = serverUrl.hostname;
          const response = await client.publicRooms({
            limit: 50,
            server: serverName,
          });

          publicRoomInfos = response.chunk
            .filter(room => !accessibleRoomInfos.some(known => known.id === room.room_id))
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
        } catch (error) {
          console.warn('Failed to fetch public rooms:', error);
          // Continue without public rooms
        }
      }

      const allRooms = [...accessibleRoomInfos, ...publicRoomInfos].sort((a, b) => {
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

  // Search public rooms
  const searchPublicRooms = useCallback(
    async (searchTerm?: string, limit = 20) => {
      if (!client) {
        console.warn('Cannot search rooms: Client not initialized');
        setPublicRoomsError('Chat client not initialized');
        return [];
      }

      const syncState = client.getSyncState();
      if (syncState !== SyncState.Prepared) {
        console.warn('Cannot search rooms: Client not synced, current state:', syncState);
        setPublicRoomsError('Connecting to server...');
        return [];
      }

      try {
        setIsLoadingPublicRooms(true);
        setPublicRoomsError(null);

        const serverUrl = new URL(client.baseUrl);
        const serverName = serverUrl.hostname;

        const response = await client.publicRooms({
          limit,
          server: serverName,
          filter: {
            generic_search_term: searchTerm,
          },
          include_all_networks: false,
        });

        const publicRoomInfos = response.chunk
          .filter(room => {
            // Filter out rooms the user is already in
            const existingRoom = client.getRoom(room.room_id);
            return !existingRoom || existingRoom.getMyMembership() !== 'join';
          })
          .map(room => ({
            id: room.room_id,
            name: room.name || room.room_id,
            topic: room.topic,
            avatarUrl:
              (room.avatar_url && client.mxcUrlToHttp(room.avatar_url, 96, 96, 'crop')) ||
              undefined,
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
    },
    [client]
  );

  // Listen for room events with proper sync state handling
  useEffect(() => {
    if (!client || !isInitialized) {
      setIsLoading(true);
      return;
    }

    const onSync = (state: SyncState, prevState: SyncState | null) => {
      // Update rooms on any sync state change to Prepared
      if (state === SyncState.Prepared) {
        updateRooms();
      }
    };

    const onRoomStateEvent = (event: MatrixEvent) => {
      // Only update on specific room state changes
      const type = event.getType();
      if (
        type === 'm.room.name' ||
        type === 'm.room.topic' ||
        type === 'm.room.avatar' ||
        type === 'm.room.canonical_alias' ||
        type === 'm.room.join_rules' ||
        type === 'm.room.member'
      ) {
        updateRooms();
      }
    };

    const onMembershipChange = (room: Room, membership: string) => {
      updateRooms();
    };

    // Initial room list - try to load even if not fully synced
    updateRooms();

    // Listen for sync state and specific room events
    client.on(ClientEvent.Sync, onSync);
    client.on(ClientEvent.Event, onRoomStateEvent);
    client.on(RoomEvent.MyMembership, onMembershipChange);

    return () => {
      client.removeListener(ClientEvent.Sync, onSync);
      client.removeListener(ClientEvent.Event, onRoomStateEvent);
      client.removeListener(RoomEvent.MyMembership, onMembershipChange);
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
    updateRooms,
  };
}
