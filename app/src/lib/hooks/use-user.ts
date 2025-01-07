import { useUserStore } from '@/lib/store';
import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useUser() {
  const { setUser } = useUserStore();
  const queryClient = useQueryClient();

  const user = trpc.user.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const updateStatus = trpc.user.updateStatus.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['user.me']);
    },
  });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['user.me']);
    },
  });

  // Sync query data with Zustand store
  useEffect(() => {
    if (user.data) {
      setUser(user.data);
    }
  }, [user.data, setUser]);

  return {
    user,
    updateStatus,
    updateProfile,
    isLoading: user.isLoading,
    error: user.error,
  };
}
