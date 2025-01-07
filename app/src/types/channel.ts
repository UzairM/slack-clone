export interface User {
  id: string;
  name: string;
  email: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  avatar?: string;
  customStatus?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: Date;
}

export interface Channel {
  id: string;
  type: 'public' | 'private' | 'direct';
  name: string;
  members: User[];
  unreadCount: number;
  lastMessage?: Message;
}
