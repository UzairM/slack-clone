'use client';

import { MessageCircle, Share2, Smile, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

interface MessageCardProps {
  avatar: string;
  username: string;
  timestamp: string;
  content: string;
  replies?: number;
  reactions?: number;
}

export function MessageCard({
  avatar,
  username,
  timestamp,
  content,
  replies = 0,
  reactions = 0,
}: MessageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="message-hover p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
          <img src={avatar} alt={username} className="w-full h-full object-cover" />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Message Header */}
          <div className="flex items-center gap-2">
            <span className="message-username">{username}</span>
            <span className="message-timestamp">{timestamp}</span>
          </div>

          {/* Message Text */}
          <p className="message-text mt-1">{content}</p>

          {/* Message Actions */}
          <div className="mt-2 flex items-center gap-2">
            {/* Replies */}
            <button className="action-button">
              <MessageCircle className="action-button-icon" />
              {replies > 0 && <span className="action-button-text">{replies}</span>}
            </button>

            {/* Reactions */}
            <button className="action-button">
              <Smile className="action-button-icon" />
              {reactions > 0 && <span className="action-button-text">{reactions}</span>}
            </button>

            {/* Share - Only visible on hover */}
            <button className={`action-button ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <Share2 className="action-button-icon" />
            </button>
          </div>

          {/* Reaction Display */}
          {reactions > 0 && (
            <div className="mt-2 flex gap-1">
              <div className="reaction-badge">
                <ThumbsUp className="reaction-icon" />
                <span className="reaction-count">{reactions}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
