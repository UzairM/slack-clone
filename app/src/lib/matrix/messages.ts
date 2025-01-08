import { EventType, MatrixEvent, MsgType, RelationType, Room } from 'matrix-js-sdk';

export interface Message {
  id: string;
  content: string;
  type: MsgType;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  timestamp: number;
  isEdited: boolean;
  editedTimestamp?: number;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  status: 'sending' | 'sent' | 'error';
  reactions: Record<string, number>;
}

export function convertEventToMessage(
  event: MatrixEvent,
  room: Room,
  baseUrl: string
): Message | null {
  const sender = event.getSender();
  const eventId = event.getId();
  if (!sender || !eventId) return null;

  const member = room.getMember(sender);
  const content = event.getContent();
  const prevContent = event.getPrevContent();
  const isEdited = !!prevContent.body;

  // Get reply-to content if it exists
  let replyTo: Message['replyTo'] | undefined;
  const inReplyTo = content['m.relates_to']?.['m.in_reply_to'];
  if (inReplyTo && typeof inReplyTo === 'object' && 'event_id' in inReplyTo && inReplyTo.event_id) {
    const replyEvent = room.findEventById(inReplyTo.event_id);
    if (replyEvent) {
      const replyContent = replyEvent.getContent();
      const replySender = replyEvent.getSender();
      if (replySender) {
        replyTo = {
          id: inReplyTo.event_id,
          content: replyContent.body || '',
          sender: replySender,
        };
      }
    }
  }

  // Get reactions for this message
  const reactions: Record<string, number> = {};
  const timeline = room.getLiveTimeline();
  const events = timeline.getEvents();
  events.forEach(e => {
    const relation = e.getRelation();
    if (
      e.getType() === EventType.Reaction &&
      relation?.rel_type === RelationType.Annotation &&
      relation?.event_id === eventId &&
      relation?.key
    ) {
      const key = relation.key;
      reactions[key] = (reactions[key] || 0) + 1;
    }
  });

  const avatarUrl = member?.getAvatarUrl(baseUrl || '', 32, 32, 'crop', true, false);

  return {
    id: eventId,
    content: content.body || '',
    type: (content.msgtype as MsgType) || MsgType.Text,
    sender: {
      id: sender,
      name: member?.name ?? sender,
      avatarUrl: avatarUrl || undefined,
    },
    timestamp: event.getTs(),
    isEdited,
    editedTimestamp: isEdited ? event.getTs() : undefined,
    replyTo,
    status: 'sent',
    reactions,
  };
}

interface MessageEventContent {
  msgtype: MsgType;
  body: string;
  format?: string;
  formatted_body?: string;
  'm.relates_to'?: {
    'm.in_reply_to'?: {
      event_id: string;
    };
    rel_type?: string;
    event_id?: string;
  };
  'm.new_content'?: {
    msgtype: MsgType;
    body: string;
  };
}

export function createMessageContent(
  body: string,
  msgtype: MsgType = MsgType.Text,
  replyTo?: string
): MessageEventContent {
  const content: MessageEventContent = {
    msgtype,
    body,
  };

  if (replyTo) {
    content['m.relates_to'] = {
      'm.in_reply_to': {
        event_id: replyTo,
      },
    };
  }

  return content;
}

export function createEditContent(targetEventId: string, newContent: string): MessageEventContent {
  const content: MessageEventContent = {
    msgtype: MsgType.Text,
    body: `* ${newContent}`,
    'm.new_content': {
      msgtype: MsgType.Text,
      body: newContent,
    },
    'm.relates_to': {
      rel_type: 'm.replace',
      event_id: targetEventId,
    },
  };

  return content;
}
