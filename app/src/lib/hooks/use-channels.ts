import { useChannelStore } from '@/lib/store';
import { trpc } from '@/lib/trpc/client';
import type { Channel } from '@/types/channel';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useChannels() {
  const { setChannels } = useChannelStore();
  const queryClient = useQueryClient();

  const channels = trpc.channels.list.useQuery(undefined, {
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds
  });

  const createChannel = trpc.channels.create.useMutation({
    onSuccess: (newChannel) => {
      // Invalidate channels query to refetch
      queryClient.invalidateQueries(['channels.list']);
    },
  });

  const deleteChannel = trpc.channels.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['channels.list']);
    },
  });

  // Sync query data with Zustand store
  useEffect(() => {
    if (channels.data) {
      // Cast the data to Channel[] since we know the structure matches
      setChannels(channels.data as Channel[]);
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
