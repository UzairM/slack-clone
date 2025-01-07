import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const PAGE_SIZE = 50;

export function useMessages(channelId: string) {
  const queryClient = useQueryClient();

  const messages = trpc.messages.list.useInfiniteQuery(
    {
      channelId,
      limit: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      getPreviousPageParam: (firstPage) => firstPage.prevCursor,
      initialCursor: 0, // Start from most recent
      refetchInterval: 1000 * 5, // 5 seconds
    }
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      // Invalidate only the latest page of messages
      queryClient.invalidateQueries(['messages.list']);
    },
  });

  const deleteMessage = trpc.messages.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['messages.list']);
    },
  });

  // Auto-fetch next page when near the end
  useEffect(() => {
    if (messages.hasNextPage && !messages.isFetchingNextPage) {
      const lastMessage = document.querySelector('[data-index="0"]');
      if (lastMessage) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              messages.fetchNextPage();
            }
          },
          { threshold: 0.5 }
        );
        observer.observe(lastMessage);
        return () => observer.disconnect();
      }
    }
  }, [messages.hasNextPage, messages.isFetchingNextPage, messages]);

  return {
    messages,
    sendMessage,
    deleteMessage,
    isLoading: messages.isLoading,
    error: messages.error,
  };
}
