import { useUserStore } from '@/lib/store';
import type { User } from '@/lib/store/user-store';
import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useUser() {
  const { setUser } = useUserStore();
  const queryClient = useQueryClient();

  const user = trpc.user.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const updateStatus = trpc.user.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['user.list']);
    },
  });

  const updateProfile = trpc.user.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['user.list']);
    },
  });

  useEffect(() => {
    if (user.data?.[0]) {
      const userData = user.data[0];
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || undefined,
        status: (userData.status as User['status']) || 'offline',
        customStatus: userData.customStatus || undefined,
      });
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
