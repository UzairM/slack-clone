import { create } from 'zustand';
import { User } from './user-store';

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: User[];
  lastMessage?: {
    id: string;
    content: string;
    sender: User;
    timestamp: Date;
  };
  unreadCount: number;
}

interface ChannelState {
  channels: Channel[];
  activeChannel: Channel | null;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (channelId: string) => void;
  setActiveChannel: (channel: Channel | null) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  updateUnreadCount: (channelId: string, count: number) => void;
}

export const useChannelStore = create<ChannelState>()(set => ({
  channels: [],
  activeChannel: null,
  setChannels: channels => set({ channels }),
  addChannel: channel => set(state => ({ channels: [...state.channels, channel] })),
  removeChannel: channelId =>
    set(state => ({
      channels: state.channels.filter(c => c.id !== channelId),
      activeChannel: state.activeChannel?.id === channelId ? null : state.activeChannel,
    })),
  setActiveChannel: channel => set({ activeChannel: channel }),
  updateChannel: (channelId, updates) =>
    set(state => ({
      channels: state.channels.map(c => (c.id === channelId ? { ...c, ...updates } : c)),
      activeChannel:
        state.activeChannel?.id === channelId
          ? { ...state.activeChannel, ...updates }
          : state.activeChannel,
    })),
  updateUnreadCount: (channelId, count) =>
    set(state => ({
      channels: state.channels.map(c => (c.id === channelId ? { ...c, unreadCount: count } : c)),
    })),
}));
