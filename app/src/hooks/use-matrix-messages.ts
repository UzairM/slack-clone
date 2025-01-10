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
  RoomMemberEvent,
  SyncState,
  TimelineWindow,
} from 'matrix-js-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ReactionMap {
  [key: string]: {
    count: number;
    userIds: string[];
  };
}

interface ThreadSummary {
  latestReply?: {
    id: string;
    content: string;
    sender: string;
    timestamp: number;
  };
  replyCount: number;
  isUnread: boolean;
}

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
  reactions?: ReactionMap;
  // Thread support
  threadId?: string; // If this message is part of a thread, this is the root message ID
  isThreadRoot?: boolean; // If this message is the start of a thread
  thread?: ThreadSummary; // Thread summary for root messages
  replyTo?: {
    // If this message is a reply to another message
    id: string;
    content: string;
    sender: string;
  };
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
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 5;
  const [retryCount, setRetryCount] = useState(0);

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

      // Get thread information
      const relation = event.getRelation();
      const isThreaded = relation?.rel_type === 'm.thread';
      const threadId = isThreaded ? relation.event_id : undefined;
      const room = client?.getRoom(event.getRoomId() || '');
      const isThreadRoot = !threadId && (event.getThread()?.events?.length ?? 0) > 0;

      // Get thread summary for root messages
      let thread: ThreadSummary | undefined;
      if (isThreadRoot && room) {
        const threadEvents = event.getThread()?.events ?? [];
        const latestReply = threadEvents[threadEvents.length - 1];
        thread = {
          replyCount: threadEvents.length,
          isUnread: threadEvents.some(
            (e: MatrixEvent) => !room.hasUserReadEvent(userId || '', e.getId() || '')
          ),
          ...(latestReply && {
            latestReply: {
              id: latestReply.getId() || '',
              content: latestReply.getContent().body || '',
              sender: latestReply.getSender() || '',
              timestamp: latestReply.getTs(),
            },
          }),
        };
      }

      // Get reply information
      let replyTo: MessageEvent['replyTo'];
      const replyToEvent = content['m.relates_to']?.['m.in_reply_to']?.event_id;
      if (replyToEvent && room) {
        const originalEvent = room.findEventById(replyToEvent);
        if (originalEvent) {
          replyTo = {
            id: replyToEvent,
            content: originalEvent.getContent().body || '',
            sender: originalEvent.getSender() || '',
          };
        }
      }

      // Get reactions for the event
      let reactions: ReactionMap = {};

      if (room && event.getId()) {
        // Get all events in the room's timeline
        const timeline = room.getLiveTimeline();
        const timelineEvents = timeline.getEvents();

        // Filter for reaction events related to this message
        const reactionEvents = timelineEvents.filter(e => {
          const relation = e.getRelation();
          return (
            e.getType() === EventType.Reaction &&
            relation?.rel_type === RelationType.Annotation &&
            relation?.event_id === event.getId()
          );
        });

        // Group reactions by emoji
        reactions = reactionEvents.reduce((acc: ReactionMap, e: MatrixEvent) => {
          const key = e.getRelation()?.key || '';
          if (!acc[key]) {
            acc[key] = {
              count: 0,
              userIds: [],
            };
          }
          acc[key].count++;
          const sender = e.getSender();
          if (sender && !acc[key].userIds.includes(sender)) {
            acc[key].userIds.push(sender);
          }
          return acc;
        }, {});
      }

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
        reactions,
        threadId,
        isThreadRoot,
        thread,
        replyTo,
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
    [client, userId]
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
      if (!client || !isInitialized) {
        console.warn('Cannot load messages: Client not initialized');
        setError('Chat client not initialized');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const room = client.getRoom(roomId);
        if (!room) {
          console.error('Room not found:', roomId);
          throw new Error('Room not found');
        }

        console.log('Loading messages for room:', roomId);

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
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [client, isInitialized, roomId, convertEvent, localMessages]
  );

  // Handle sync state changes
  useEffect(() => {
    if (!client || !isInitialized) return;

    const handleSyncStateChange = (state: SyncState) => {
      if (state === SyncState.Prepared) {
        loadMessages();
      }
    };

    client.on(ClientEvent.Sync, handleSyncStateChange);

    // Initial load
    loadMessages();

    return () => {
      client.removeListener(ClientEvent.Sync, handleSyncStateChange);
    };
  }, [client, isInitialized, loadMessages]);

  // Send typing notification
  const sendTypingNotification = useCallback(
    async (isTyping: boolean) => {
      if (!client || !isInitialized) {
        console.log('Cannot send typing notification: client not ready', { client, isInitialized });
        return;
      }

      try {
        console.log('Sending typing notification:', {
          roomId,
          isTyping,
          userId,
          timeout: isTyping ? 4000 : 0,
        });

        await client.sendTyping(roomId, isTyping, isTyping ? 4000 : 0);

        // Check if typing state was updated
        const room = client.getRoom(roomId);
        const typingEvents = room?.currentState.getStateEvents('m.typing', '');
        const typingEvent = Array.isArray(typingEvents) ? typingEvents[0] : typingEvents;
        const typingContent = typingEvent?.getContent() || {};

        console.log('Typing notification sent, current state:', {
          success: true,
          typingContent,
          currentTypingUsers: typingContent.user_ids || [],
        });
      } catch (error) {
        console.error('Failed to send typing notification:', error);
      }
    },
    [client, isInitialized, roomId, userId]
  );

  // Handle user typing with debounce
  const handleUserTyping = useCallback(() => {
    console.log('User typing detected');
    if (typingTimeoutRef.current) {
      console.log('Clearing previous typing timeout');
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingNotification(true);

    console.log('Setting typing timeout for 4 seconds');
    typingTimeoutRef.current = setTimeout(() => {
      console.log('Typing timeout reached, sending stop typing notification');
      sendTypingNotification(false);
    }, 4000);
  }, [sendTypingNotification]);

  // Listen for room events
  useEffect(() => {
    if (!client || !isInitialized) return;

    const room = client.getRoom(roomId);
    if (!room) {
      console.warn('Room not found:', roomId);
      return;
    }

    console.log('Setting up room event listeners for room:', roomId);

    const handleTimelineEvent = (event: MatrixEvent) => {
      if (event.getRoomId() !== roomId) return;
      loadMessages();
    };

    const handleReceiptEvent = (event: MatrixEvent, room: Room) => {
      handleReceipt(event, room);
    };

    const handleTypingEvent = (_event: any, member: any) => {
      console.log('Typing event received:', { member, roomId: member?.roomId });
      if (member.roomId !== roomId) {
        console.log('Ignoring typing event for different room');
        return;
      }

      // Ignore typing events from the current user
      if (member.userId === userId) {
        console.log('Ignoring typing event from current user');
        return;
      }

      const room = client.getRoom(roomId);
      if (!room) {
        console.log('Room not found for typing event');
        return;
      }

      // Update typing users based on the member's typing state
      setTypingUsers(prev => {
        const newTypingUsers = member.typing
          ? [...prev, member.name || member.userId.slice(1).split(':')[0]]
          : prev.filter(name => name !== (member.name || member.userId.slice(1).split(':')[0]));

        console.log('Processing typing event:', {
          member,
          memberTyping: member.typing,
          memberName: member.name,
          memberId: member.userId,
          currentUserId: userId,
          previousTypingUsers: prev,
          newTypingUsers,
        });

        return newTypingUsers;
      });
    };

    room.on(RoomEvent.Timeline, handleTimelineEvent);
    room.on(RoomEvent.Receipt, handleReceiptEvent);
    client.on(RoomMemberEvent.Typing, handleTypingEvent);

    // Initial check for typing users
    console.log('Performing initial typing check');
    handleTypingEvent(null, { roomId });

    return () => {
      console.log('Cleaning up room event listeners');
      room.removeListener(RoomEvent.Timeline, handleTimelineEvent);
      room.removeListener(RoomEvent.Receipt, handleReceiptEvent);
      client.removeListener(RoomMemberEvent.Typing, handleTypingEvent);
    };
  }, [client, isInitialized, roomId, loadMessages, handleReceipt, userId]);

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

  // Send message with thread support
  const sendMessage = useCallback(
    async (content: string, options?: { threadId?: string; replyTo?: string }) => {
      if (!client) throw new Error('Client not initialized');

      // Create optimistic message
      const optimisticId = `local-${Date.now()}`;
      const optimisticMessage: MessageEvent = {
        id: optimisticId,
        content,
        sender: userId || '',
        timestamp: Date.now(),
        type: MsgType.Text,
        status: 'sending',
        threadId: options?.threadId,
        replyTo: options?.replyTo
          ? {
              id: options.replyTo,
              content: messages.find(m => m.id === options.replyTo)?.content || '',
              sender: messages.find(m => m.id === options.replyTo)?.sender || '',
            }
          : undefined,
      };

      // Add to local messages
      setLocalMessages(prev => new Map(prev).set(optimisticId, optimisticMessage));
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        const room = client.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        // Prepare message content with thread/reply relations
        const messageContent: any = {
          msgtype: MsgType.Text,
          body: content,
        };

        // Add thread relation if this is a thread reply
        if (options?.threadId) {
          messageContent['m.relates_to'] = {
            rel_type: 'm.thread',
            event_id: options.threadId,
          };
        }

        // Add reply relation if this is a reply
        if (options?.replyTo) {
          if (!messageContent['m.relates_to']) {
            messageContent['m.relates_to'] = {};
          }
          messageContent['m.relates_to']['m.in_reply_to'] = {
            event_id: options.replyTo,
          };
        }

        const result = await client.sendEvent(roomId, EventType.RoomMessage, messageContent);

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
    [client, roomId, userId, updateMessageStatus, messages]
  );

  // Upload file and send as message
  const uploadFile = useCallback(
    async (file: File) => {
      if (!client || !isInitialized) throw new Error('Client not initialized');

      // Create optimistic message ID
      const optimisticId = `local-${Date.now()}`;

      try {
        // Create optimistic message
        const optimisticMessage: MessageEvent = {
          id: optimisticId,
          content: `Uploading ${file.name}...`,
          sender: userId || '',
          timestamp: Date.now(),
          type: file.type.startsWith('image/')
            ? 'm.image'
            : file.type.startsWith('video/')
              ? 'm.video'
              : file.type.startsWith('audio/')
                ? 'm.audio'
                : 'm.file',
          status: 'sending',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };

        // Add to local messages
        setLocalMessages(prev => new Map(prev).set(optimisticId, optimisticMessage));
        setMessages(prev => [...prev, optimisticMessage]);

        // Create upload progress handler
        const progressHandler = (progress: { loaded: number; total: number }) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          // Update optimistic message with progress
          setMessages(prev =>
            prev.map(msg =>
              msg.id === optimisticId
                ? {
                    ...msg,
                    content: `Uploading ${file.name} (${percentage}%)...`,
                  }
                : msg
            )
          );
        };

        // Upload the file
        const uploadResponse = await client.uploadContent(file, {
          progressHandler,
        });

        if (!uploadResponse?.content_uri) {
          throw new Error('Failed to upload file: No content URI received');
        }

        // Prepare message content based on file type
        const messageContent: any = {
          msgtype: file.type.startsWith('image/')
            ? 'm.image'
            : file.type.startsWith('video/')
              ? 'm.video'
              : file.type.startsWith('audio/')
                ? 'm.audio'
                : 'm.file',
          body: file.name,
          filename: file.name,
          info: {
            size: file.size,
            mimetype: file.type,
          },
          url: uploadResponse.content_uri,
        };

        // Add file type specific properties
        if (file.type.startsWith('image/')) {
          // Get image dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });
          messageContent.info.w = img.width;
          messageContent.info.h = img.height;
          URL.revokeObjectURL(img.src);
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
            video.src = URL.createObjectURL(file);
          });
          messageContent.info.duration = Math.round(video.duration * 1000);
          URL.revokeObjectURL(video.src);
        } else if (file.type.startsWith('audio/')) {
          const audio = document.createElement('audio');
          await new Promise((resolve, reject) => {
            audio.onloadedmetadata = resolve;
            audio.onerror = reject;
            audio.src = URL.createObjectURL(file);
          });
          messageContent.info.duration = Math.round(audio.duration * 1000);
          URL.revokeObjectURL(audio.src);
        }

        // Send the message
        const result = await client.sendMessage(roomId, messageContent);

        if (!result?.event_id) {
          throw new Error('Failed to send message: No event ID received');
        }

        // Update local message with real ID
        setLocalMessages(prev => {
          const updated = new Map(prev);
          updated.delete(optimisticId);
          return updated;
        });

        // Update message status
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticId
              ? {
                  ...msg,
                  id: result.event_id,
                  content: file.name,
                  status: 'sent',
                  mediaUrl: uploadResponse.content_uri,
                }
              : msg
          )
        );

        return result;
      } catch (err: any) {
        console.error('Failed to upload file:', err);
        // Update message status to error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticId
              ? {
                  ...msg,
                  content: `Failed to upload ${file.name}`,
                  status: 'error',
                  error: err.message || 'Failed to upload file',
                }
              : msg
          )
        );
        throw err;
      }
    },
    [client, isInitialized, roomId, userId]
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

  // Handle read receipt updates
  useEffect(() => {
    if (!client || !isInitialized) return;

    const handleReadReceipt = (_event: any, room: Room) => {
      if (room.roomId !== roomId) return;

      // Update messages with new read receipts
      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => {
          if (!msg.id) return msg;

          // Get receipt info for this event
          const event = room.findEventById(msg.id);
          if (!event) return msg;

          const receiptTimeline = room.getReceiptsForEvent(event);
          const readReceipt = receiptTimeline?.find(
            receipt => receipt.type === 'm.read' && receipt.userId !== client.getUserId()
          );

          // Update status based on receipt
          let status = msg.status;
          if (readReceipt) {
            status = 'read';
          } else if (status !== 'read' && room.hasUserReadEvent(client.getUserId()!, msg.id)) {
            status = 'delivered';
          }

          return status !== msg.status ? { ...msg, status } : msg;
        });

        return updatedMessages;
      });
    };

    // Listen for receipt events
    client.on(RoomEvent.Receipt, handleReadReceipt);

    return () => {
      client.removeListener(RoomEvent.Receipt, handleReadReceipt);
    };
  }, [client, isInitialized, roomId]);

  // Send read receipts for latest event
  useEffect(() => {
    if (!client || !isInitialized || !roomId) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    // Get the latest event in the room
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const latestEvent = events[events.length - 1];

    // Only proceed if we have a valid event with an ID
    if (latestEvent && latestEvent instanceof MatrixEvent && latestEvent.getId()) {
      const eventId = latestEvent.getId()!;
      if (!room.hasUserReadEvent(client.getUserId()!, eventId)) {
        // Use the official SDK method to send read receipt
        client.setRoomReadMarkers(roomId, eventId, latestEvent).catch(error => {
          console.error('Failed to send read receipt:', error);
        });

        // Also send a regular read receipt for immediate feedback
        client.sendReadReceipt(latestEvent).catch(error => {
          console.error('Failed to send regular read receipt:', error);
        });
      }
    }
  }, [client, isInitialized, roomId, messages]);

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
    typingUsers,
    handleUserTyping,
    uploadFile,
  };
}
