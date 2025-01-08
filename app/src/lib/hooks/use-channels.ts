import { useChannelStore } from '@/lib/store';
import type { Channel } from '@/lib/store/channel-store';
import type { User } from '@/lib/store/user-store';
import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useChannels() {
  const { setChannels } = useChannelStore();
  const queryClient = useQueryClient();

  const channels = trpc.channel.list.useQuery(undefined, {
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds
  });

  const createChannel = trpc.channel.create.useMutation({
    onSuccess: newChannel => {
      queryClient.invalidateQueries(['channel.list']);
    },
  });

  const deleteChannel = trpc.channel.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['channel.list']);
    },
  });

  useEffect(() => {
    if (channels.data) {
      const transformedChannels = channels.data.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type as Channel['type'],
        members: channel.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar || undefined,
          status: member.status || 'offline',
          customStatus: member.customStatus || undefined,
        })) as User[],
        unreadCount: 0,
      }));
      setChannels(transformedChannels);
    }
  }, [channels.data, setChannels]);

  return {
    channels,
    createChannel,
    deleteChannel,
    isLoading: channels.isLoading,
    error: channels.error,
  };
}
