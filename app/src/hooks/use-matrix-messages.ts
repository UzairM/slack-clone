import { useMatrix } from '@/hooks/use-matrix';
import { convertEventToMessage, Message } from '@/lib/matrix/messages';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  EventType,
  MatrixEvent,
  MsgType,
  RelationType,
  RoomEmittedEvents,
  RoomEvent,
} from 'matrix-js-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useMatrixMessages(roomId: string) {
  const { client, isInitialized } = useMatrix();
  const { userId } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs for cleanup
  const eventListeners = useRef<{ event: RoomEmittedEvents; listener: any }[]>([]);
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current = [];

    // Remove all event listeners
    if (client) {
      const room = client.getRoom(roomId);
      if (room) {
        eventListeners.current.forEach(({ event, listener }) => {
          room.removeListener(event, listener);
        });
      }
    }
    eventListeners.current = [];
  }, [client, roomId]);

  // Retry function
  const retryOperation = useCallback(
    async (operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
      try {
        return await operation();
      } catch (error) {
        if (retries > 0) {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(async () => {
              try {
                const result = await retryOperation(operation, retries - 1);
                resolve(result);
              } catch (err) {
                reject(err);
              }
            }, RETRY_DELAY);
            timeouts.current.push(timeout);
          });
        }
        throw error;
      }
    },
    []
  );

  // Load messages
  const loadMessages = useCallback(
    async (limit = 50) => {
      if (!client || !isInitialized) return;

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          // Get timeline events
          const timeline = room.getLiveTimeline();
          const events = timeline
            .getEvents()
            .filter(event => event.getType() === EventType.RoomMessage)
            .map(event => convertEventToMessage(event, room, client.baseUrl || ''))
            .filter((msg): msg is Message => msg !== null)
            .sort((a, b) => a.timestamp - b.timestamp);

          setMessages(events);
          setHasMore(events.length >= limit);
          setError(null);
        });
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setError(err.message || 'Failed to load messages');
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [client, isInitialized, roomId, retryOperation]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!client || !isInitialized || !hasMore) return;

    try {
      await retryOperation(async () => {
        const room = client.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        // Get more events from the timeline
        await client.scrollback(room, 50);
        await loadMessages(50);
      });
    } catch (err: any) {
      console.error('Failed to load more messages:', err);
      setError(err.message || 'Failed to load more messages');
      toast.error('Failed to load more messages');
    }
  }, [client, isInitialized, hasMore, roomId, loadMessages, retryOperation]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, replyTo?: string) => {
      if (!client || !isInitialized || !userId) throw new Error('Client not initialized');

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          const member = room.getMember(userId);
          const avatarUrl = member?.getAvatarUrl(client.baseUrl || '', 32, 32, 'crop', true, false);

          // Create temporary message
          const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content,
            type: MsgType.Text,
            sender: {
              id: userId,
              name: member?.name || userId,
              avatarUrl: avatarUrl || undefined,
            },
            timestamp: Date.now(),
            isEdited: false,
            status: 'sending',
            reactions: {},
            ...(replyTo && {
              replyTo: {
                id: replyTo,
                content: messages.find(m => m.id === replyTo)?.content || '',
                sender: messages.find(m => m.id === replyTo)?.sender.id || '',
              },
            }),
          };

          // Add temporary message to state
          setMessages(prev => [...prev, tempMessage]);

          // Send message
          if (replyTo) {
            await client.sendMessage(roomId, {
              msgtype: MsgType.Text,
              body: content,
              'm.relates_to': {
                'm.in_reply_to': {
                  event_id: replyTo,
                },
              },
            });
          } else {
            await client.sendTextMessage(roomId, content);
          }
        });
      } catch (err: any) {
        console.error('Failed to send message:', err);
        toast.error('Failed to send message');
        throw new Error(err.message || 'Failed to send message');
      }
    },
    [client, isInitialized, roomId, userId, messages, retryOperation]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          await client.sendMessage(roomId, {
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
        });
      } catch (err: any) {
        console.error('Failed to edit message:', err);
        toast.error('Failed to edit message');
        throw new Error(err.message || 'Failed to edit message');
      }
    },
    [client, isInitialized, roomId, retryOperation]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          await client.redactEvent(roomId, messageId);
        });
      } catch (err: any) {
        console.error('Failed to delete message:', err);
        toast.error('Failed to delete message');
        throw new Error(err.message || 'Failed to delete message');
      }
    },
    [client, isInitialized, roomId, retryOperation]
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, reaction: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          await client.sendEvent(roomId, EventType.Reaction, {
            'm.relates_to': {
              rel_type: RelationType.Annotation,
              event_id: messageId,
              key: reaction,
            },
          } as any);
        });
      } catch (err: any) {
        console.error('Failed to add reaction:', err);
        toast.error('Failed to add reaction');
        throw new Error(err.message || 'Failed to add reaction');
      }
    },
    [client, isInitialized, roomId, retryOperation]
  );

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, reaction: string) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      try {
        await retryOperation(async () => {
          const room = client.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          // Find the reaction event
          const timeline = room.getLiveTimeline();
          const events = timeline.getEvents();
          const reactionEvent = events.find(
            event =>
              event.getType() === EventType.Reaction &&
              event.getRelation()?.rel_type === RelationType.Annotation &&
              event.getRelation()?.event_id === messageId &&
              event.getRelation()?.key === reaction &&
              event.getSender() === userId
          );

          if (reactionEvent) {
            await client.redactEvent(roomId, reactionEvent.getId()!);
          }
        });
      } catch (err: any) {
        console.error('Failed to remove reaction:', err);
        toast.error('Failed to remove reaction');
        throw new Error(err.message || 'Failed to remove reaction');
      }
    },
    [client, isInitialized, roomId, userId, retryOperation]
  );

  // Listen for timeline events
  useEffect(() => {
    if (!client || !isInitialized) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    const onEvent = (event: MatrixEvent) => {
      if (event.getRoomId() !== roomId) return;

      // Handle new messages
      if (event.getType() === EventType.RoomMessage) {
        const message = convertEventToMessage(event, room, client.baseUrl || '');
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      }

      // Handle edited messages
      if (event.getType() === EventType.RoomMessage && event.getPrevContent().body) {
        const message = convertEventToMessage(event, room, client.baseUrl || '');
        if (message) {
          setMessages(prev =>
            prev.map(m => (m.id === message.id ? { ...message, isEdited: true } : m))
          );
        }
      }

      // Handle deleted messages
      if (event.getType() === 'm.room.redaction') {
        const redactedId = event.getAssociatedId();
        if (redactedId) {
          setMessages(prev => prev.filter(m => m.id !== redactedId));
        }
      }

      // Handle reactions
      if (event.getType() === EventType.Reaction) {
        const relation = event.getRelation();
        if (relation && relation.rel_type === RelationType.Annotation && relation.key) {
          setMessages(prev =>
            prev.map(m => {
              if (m.id === relation.event_id) {
                const reactions = { ...(m.reactions || {}) };
                const key = relation.key as string;
                reactions[key] = (reactions[key] || 0) + 1;
                return {
                  ...m,
                  reactions,
                };
              }
              return m;
            })
          );
        }
      }

      // Handle reaction removals
      if (event.getType() === EventType.RoomRedaction) {
        const redactedEvent = room.findEventById(event.getAssociatedId()!);
        if (redactedEvent?.getType() === EventType.Reaction) {
          const relation = redactedEvent.getRelation();
          if (relation && relation.rel_type === RelationType.Annotation && relation.key) {
            setMessages(prev =>
              prev.map(m => {
                if (m.id === relation.event_id) {
                  const reactions = { ...(m.reactions || {}) };
                  const key = relation.key as string;
                  if (reactions[key]) {
                    reactions[key]--;
                    if (reactions[key] <= 0) {
                      delete reactions[key];
                    }
                  }
                  return {
                    ...m,
                    reactions,
                  };
                }
                return m;
              })
            );
          }
        }
      }
    };

    // Add event listener
    room.on(RoomEvent.Timeline, onEvent);
    eventListeners.current.push({ event: RoomEvent.Timeline, listener: onEvent });

    // Load initial messages
    loadMessages();

    // Cleanup
    return cleanup;
  }, [client, isInitialized, roomId, loadMessages, cleanup]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
  };
}
