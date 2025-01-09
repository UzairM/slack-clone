'use client';

import { useMatrix } from '@/hooks/use-matrix';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  ClientEvent,
  Direction,
  EventStatus,
  EventType,
  MatrixEvent,
  MsgType,
  RelationType,
  Room,
  RoomEvent,
  SyncState,
  SyncStateData,
  TimelineWindow,
} from 'matrix-js-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface MessageEvent {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  type: 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.location' | 'm.emote';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  error?: string;
  isEdited?: boolean;
  editedTimestamp?: number;
  originalContent?: string;
  // Additional fields for rich content
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: number;
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
}

export function useMatrixMessages(roomId: string) {
  const { client, isInitialized } = useMatrix();
  const { userId } = useAuthStore();
  const [messages, setMessages] = useState<MessageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [localMessages, setLocalMessages] = useState<Map<string, MessageEvent>>(new Map());
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const timelineWindowRef = useRef<TimelineWindow>();

  // Convert Matrix event to message
  const convertEvent = useCallback(
    (event: MatrixEvent): MessageEvent | null => {
      if (event.getType() !== EventType.RoomMessage) return null;

      // Get delivery status
      let messageStatus: MessageEvent['status'] = 'sent';
      if (!event.getId()) {
        messageStatus = 'sending';
      } else if (event.status === EventStatus.NOT_SENT) {
        messageStatus = 'error';
      } else {
        const room = client?.getRoom(event.getRoomId() || '');
        if (room) {
          const receipts = room.getReceiptsForEvent(event);
          const readReceipts = receipts.filter(r => (r.type as string) === 'm.read');
          const deliveryReceipts = receipts.filter(r => (r.type as string) === 'm.delivery');

          if (readReceipts.length > 0) {
            messageStatus = 'read';
          } else if (deliveryReceipts.length > 0) {
            messageStatus = 'delivered';
          }
        }
      }

      // Check if message is edited
      const replaces = event.getRelation()?.rel_type === RelationType.Replace;
      const replacingEvent = event.replacingEvent();
      const originalEvent = replaces ? event.replacingEvent() : event;

      const content = event.getContent();
      const msgtype = content.msgtype as MessageEvent['type'];

      // Base message properties
      const baseMessage = {
        id: event.getId() || '',
        sender: event.getSender() || '',
        timestamp: event.getTs(),
        status: messageStatus,
        error: event.status === EventStatus.NOT_SENT ? event.error?.message : undefined,
        isEdited: !!replacingEvent,
        editedTimestamp: replacingEvent?.getTs(),
        originalContent: replaces ? originalEvent?.getContent().body : undefined,
      };

      // Handle different message types
      switch (msgtype) {
        case 'm.text':
        case 'm.emote':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
          };

        case 'm.image':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
            mimeType: content.info?.mimetype,
            fileSize: content.info?.size,
            thumbnailUrl: content.info?.thumbnail_url,
            mediaUrl: content.url,
          };

        case 'm.file':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
            fileName: content.filename || content.body,
            mimeType: content.info?.mimetype,
            fileSize: content.info?.size,
            mediaUrl: content.url,
          };

        case 'm.audio':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
            mimeType: content.info?.mimetype,
            fileSize: content.info?.size,
            duration: content.info?.duration,
            mediaUrl: content.url,
          };

        case 'm.video':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
            mimeType: content.info?.mimetype,
            fileSize: content.info?.size,
            duration: content.info?.duration,
            thumbnailUrl: content.info?.thumbnail_url,
            mediaUrl: content.url,
          };

        case 'm.location':
          return {
            ...baseMessage,
            type: msgtype,
            content: content.body || '',
            location: {
              latitude: content.geo_uri?.split(':')[1]?.split(',')[0],
              longitude: content.geo_uri?.split(':')[1]?.split(',')[1],
              description: content.body,
            },
          };

        default:
          // Fallback to text message
          return {
            ...baseMessage,
            type: 'm.text',
            content: content.body || '',
          };
      }
    },
    [client]
  );

  // Update message status
  const updateMessageStatus = useCallback(
    (eventId: string, status: MessageEvent['status'], error?: string) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === eventId ? { ...msg, status, ...(error ? { error } : {}) } : msg
        )
      );
    },
    []
  );

  // Handle receipt events
  const handleReceipt = useCallback(
    (event: MatrixEvent, room: Room) => {
      if (room.roomId !== roomId) return;

      const content = event.getContent();
      Object.entries(content).forEach(([eventId, receipts]) => {
        const readReceipt = receipts['m.read'];
        const deliveryReceipt = receipts['m.delivery'];

        if (readReceipt) {
          updateMessageStatus(eventId, 'read');
        } else if (deliveryReceipt) {
          updateMessageStatus(eventId, 'delivered');
        }
      });
    },
    [roomId, updateMessageStatus]
  );

  // Load messages
  const loadMessages = useCallback(
    async (limit = 50) => {
      if (!client || !isInitialized) return;

      try {
        setIsLoading(true);
        const room = client.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        // Get timeline events
        const timeline = room.getLiveTimeline();
        const events = timeline
          .getEvents()
          .filter(event => {
            // Only include valid message events that aren't redacted
            return (
              event.getType() === EventType.RoomMessage &&
              !event.isRedacted() &&
              event.getContent()?.body
            );
          })
          .map(event => convertEvent(event))
          .filter((msg): msg is MessageEvent => msg !== null)
          .sort((a, b) => a.timestamp - b.timestamp);

        // Add local messages that haven't been sent yet
        const localMsgs = Array.from(localMessages.values());
        const allMessages = [...events, ...localMsgs].sort((a, b) => a.timestamp - b.timestamp);

        setMessages(allMessages);
        setHasMore(events.length >= limit);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setError(err.message || 'Failed to load messages');
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [client, isInitialized, roomId, convertEvent, localMessages]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!client || !isInitialized || !hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const room = client.getRoom(roomId);
      if (!room) throw new Error('Room not found');

      // Initialize timeline window if needed
      if (!timelineWindowRef.current) {
        const timelineSet = room.getUnfilteredTimelineSet();
        timelineWindowRef.current = new TimelineWindow(client, timelineSet);
      }

      // Paginate backwards
      const hasMoreEvents = await timelineWindowRef.current.paginate(Direction.Backward, 50);
      setHasMore(hasMoreEvents);

      // Get events from the window
      const events = timelineWindowRef.current
        .getEvents()
        .filter(event => {
          return (
            event.getType() === EventType.RoomMessage &&
            !event.isRedacted() &&
            event.getContent()?.body
          );
        })
        .map(event => convertEvent(event))
        .filter((msg): msg is MessageEvent => msg !== null)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (events.length > 0) {
        setMessages(prev => {
          // Remove any duplicates
          const newMessages = events.filter(event => !prev.some(msg => msg.id === event.id));
          return [...newMessages, ...prev];
        });
      }
    } catch (err: any) {
      console.error('Failed to load more messages:', err);
      setError(err.message || 'Failed to load more messages');
      toast.error('Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  }, [client, isInitialized, hasMore, roomId, isLoading, convertEvent]);

  // Send message with optimistic updates
  const sendMessage = useCallback(
    async (content: string, replyTo?: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      // Create optimistic message
      const optimisticId = `local-${Date.now()}`;
      const optimisticMessage: MessageEvent = {
        id: optimisticId,
        content,
        sender: userId || '',
        timestamp: Date.now(),
        type: MsgType.Text,
        status: 'sending',
      };

      // Add to local messages
      setLocalMessages(prev => new Map(prev).set(optimisticId, optimisticMessage));
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        const room = client.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        let result;
        if (replyTo) {
          result = await client.sendEvent(roomId, EventType.RoomMessage, {
            msgtype: MsgType.Text,
            body: content,
            'm.relates_to': {
              'm.in_reply_to': {
                event_id: replyTo,
              },
            },
          });
        } else {
          result = await client.sendTextMessage(roomId, content);
        }

        // Update local message with real ID
        setLocalMessages(prev => {
          const updated = new Map(prev);
          updated.delete(optimisticId);
          return updated;
        });

        updateMessageStatus(result.event_id, 'sent');
        return result;
      } catch (err: any) {
        console.error('Failed to send message:', err);
        updateMessageStatus(optimisticId, 'error', err.message || 'Failed to send message');
        toast.error('Failed to send message');
        throw err;
      }
    },
    [client, isInitialized, roomId, userId, updateMessageStatus]
  );

  // Edit message with optimistic update
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      // Find the message to edit
      const messageToEdit = messages.find(msg => msg.id === messageId);
      if (!messageToEdit) throw new Error('Message not found');

      // Create optimistic update
      const optimisticEdit: MessageEvent = {
        ...messageToEdit,
        content: newContent,
        isEdited: true,
        editedTimestamp: Date.now(),
        originalContent: messageToEdit.content,
      };

      // Update messages optimistically
      setMessages(prev => prev.map(msg => (msg.id === messageId ? optimisticEdit : msg)));

      try {
        await client.sendEvent(roomId, EventType.RoomMessage, {
          msgtype: MsgType.Text,
          body: `* ${newContent}`,
          'm.new_content': {
            msgtype: MsgType.Text,
            body: newContent,
          },
          'm.relates_to': {
            rel_type: RelationType.Replace,
            event_id: messageId,
          },
        });
      } catch (err: any) {
        // Revert optimistic update on error
        setMessages(prev => prev.map(msg => (msg.id === messageId ? messageToEdit : msg)));
        console.error('Failed to edit message:', err);
        toast.error('Failed to edit message');
        throw err;
      }
    },
    [client, isInitialized, roomId, messages]
  );

  // Delete message with optimistic update
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      // Find the message to delete
      const messageToDelete = messages.find(msg => msg.id === messageId);
      if (!messageToDelete) throw new Error('Message not found');

      // Remove message optimistically
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      try {
        await client.redactEvent(roomId, messageId);
      } catch (err: any) {
        // Revert optimistic update on error
        setMessages(prev => {
          const index = prev.findIndex(msg => msg.timestamp > messageToDelete.timestamp);
          if (index === -1) {
            return [...prev, messageToDelete];
          }
          return [...prev.slice(0, index), messageToDelete, ...prev.slice(index)];
        });
        console.error('Failed to delete message:', err);
        toast.error('Failed to delete message');
        throw err;
      }
    },
    [client, isInitialized, roomId, messages]
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, reaction: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        await client.sendEvent(roomId, EventType.Reaction, {
          'm.relates_to': {
            rel_type: RelationType.Annotation,
            event_id: messageId,
            key: reaction,
          },
        });
      } catch (err: any) {
        console.error('Failed to add reaction:', err);
        toast.error('Failed to add reaction');
        throw err;
      }
    },
    [client, isInitialized, roomId]
  );

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, reaction: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        const room = client.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        const timeline = room.getLiveTimeline();
        const reactionEvents = timeline.getEvents().filter(event => {
          const relation = event.getRelation();
          return (
            event.getType() === EventType.Reaction &&
            relation?.rel_type === RelationType.Annotation &&
            relation?.event_id === messageId &&
            relation?.key === reaction &&
            event.getSender() === userId
          );
        });

        for (const event of reactionEvents) {
          await client.redactEvent(roomId, event.getId()!);
        }
      } catch (err: any) {
        console.error('Failed to remove reaction:', err);
        toast.error('Failed to remove reaction');
        throw err;
      }
    },
    [client, isInitialized, roomId, userId]
  );

  // Handle typing events
  const handleTyping = useCallback(
    (event: MatrixEvent, room: Room) => {
      if (room.roomId !== roomId) return;
      const typingUserIds = room.currentState
        .getStateEvents('m.typing')
        .flatMap(event => event.getContent().user_ids || [])
        .filter((id: string) => id !== userId);

      setTypingUsers(
        typingUserIds.map((id: string) => {
          const member = room.getMember(id);
          return member?.name || id.slice(1).split(':')[0];
        })
      );
    },
    [roomId, userId]
  );

  // Send typing notification
  const sendTypingNotification = useCallback(
    async (isTyping: boolean) => {
      if (!client || !isInitialized) return;

      try {
        await client.sendTyping(roomId, isTyping, isTyping ? 4000 : 0);
      } catch (error) {
        console.error('Failed to send typing notification:', error);
      }
    },
    [client, isInitialized, roomId]
  );

  // Handle user typing with debounce
  const handleUserTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingNotification(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingNotification(false);
    }, 4000);
  }, [sendTypingNotification]);

  // Handle timeline events
  const handleTimelineEvent = useCallback(
    (event: MatrixEvent) => {
      if (event.getRoomId() !== roomId) return;

      // Handle edited messages
      if (event.getRelation()?.rel_type === RelationType.Replace) {
        const targetId = event.getRelation()?.event_id;
        if (targetId) {
          const room = client?.getRoom(roomId);
          const originalEvent = room?.findEventById(targetId);

          setMessages(prev =>
            prev.map(msg =>
              msg.id === targetId
                ? {
                    ...msg,
                    content: event.getContent()['m.new_content'].body,
                    isEdited: true,
                    editedTimestamp: event.getTs(),
                    originalContent:
                      originalEvent instanceof MatrixEvent
                        ? originalEvent.getContent().body
                        : msg.content,
                  }
                : msg
            )
          );
          return;
        }
      }

      // Handle redactions (deleted messages)
      if (event.getType() === 'm.room.redaction') {
        const redactedId = event.getAssociatedId();
        if (redactedId) {
          setMessages(prev => prev.filter(msg => msg.id !== redactedId));
          return;
        }
      }

      // Handle redacted messages
      if (event.isRedacted()) {
        const redactionEvent = event.getRedactionEvent();
        const redactedEvent = event.getId();
        if (redactedEvent) {
          setMessages(prev => prev.filter(msg => msg.id !== redactedEvent));
          return;
        }
      }

      // Handle new messages and other updates
      const msg = convertEvent(event);
      if (msg) {
        setMessages(prev => {
          // Remove any existing message with the same ID
          const filtered = prev.filter(m => m.id !== msg.id);
          // Add the new/updated message
          return [...filtered, msg].sort((a, b) => a.timestamp - b.timestamp);
        });
        return;
      }

      loadMessages();
    },
    [roomId, loadMessages, client, convertEvent]
  );

  // Listen for room events
  useEffect(() => {
    if (!client || !isInitialized) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    const handleTimelineEvent = (event: MatrixEvent) => {
      if (event.getRoomId() !== roomId) return;
      loadMessages();
    };

    const handleReceiptEvent = (event: MatrixEvent, room: Room) => {
      handleReceipt(event, room);
    };

    const handleSyncStateChange = (
      state: SyncState,
      prevState: SyncState | null,
      data?: SyncStateData
    ) => {
      // When sync completes after being disconnected, reload messages
      if (
        state === SyncState.Syncing &&
        prevState &&
        [SyncState.Error, SyncState.Reconnecting].includes(prevState)
      ) {
        loadMessages();
      }

      // Handle typing indicators
      if (state === SyncState.Syncing) {
        const room = client.getRoom(roomId);
        if (!room) return;

        const typingEvent = room.currentState.getStateEvents('m.typing')[0];
        const typingUserIds = typingEvent ? typingEvent.getContent().user_ids || [] : [];

        setTypingUsers(
          typingUserIds
            .filter((id: string) => id !== userId)
            .map((id: string) => {
              const member = room.getMember(id);
              return member?.name || id.slice(1).split(':')[0];
            })
        );
      }
    };

    room.on(RoomEvent.Timeline, handleTimelineEvent);
    room.on(RoomEvent.Receipt, handleReceiptEvent);
    client.on(ClientEvent.Sync, handleSyncStateChange);

    loadMessages();
    handleSyncStateChange(SyncState.Syncing, null); // Initial typing status

    return () => {
      room.removeListener(RoomEvent.Timeline, handleTimelineEvent);
      room.removeListener(RoomEvent.Receipt, handleReceiptEvent);
      client.removeListener(ClientEvent.Sync, handleSyncStateChange);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [client, isInitialized, roomId, loadMessages, handleReceipt, userId]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    typingUsers,
    handleUserTyping,
  };
}
