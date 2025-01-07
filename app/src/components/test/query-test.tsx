'use client';

import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryTest() {
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  // Test query with caching
  const messages = trpc.message.list.useQuery(
    { limit: 10 },
    {
      staleTime: 10000, // Data becomes stale after 10 seconds
      cacheTime: 60000, // Cache is kept for 1 minute
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  // Test mutation with optimistic updates
  const addMessage = trpc.message.create.useMutation({
    onMutate: async newMessage => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['message.list'] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['message.list']);

      // Optimistically update to the new value
      queryClient.setQueryData(['message.list'], (old: any) => ({
        messages: [
          ...(old?.messages || []),
          {
            id: 'temp-' + Date.now(),
            content: newMessage.content,
            createdAt: new Date(),
            authorId: 'current-user',
          },
        ],
      }));

      // Return the snapshot
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['message.list'], context?.previousMessages);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['message.list'] });
    },
  });

  const handleAddMessage = () => {
    if (!messageText.trim()) return;

    addMessage.mutate({
      content: messageText,
      channelId: 'test-channel',
      authorId: 'current-user',
    });

    setMessageText('');
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Query Caching Test</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2 rounded border"
              placeholder="Enter message"
            />
            <button
              onClick={handleAddMessage}
              disabled={addMessage.isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              {addMessage.isLoading ? 'Adding...' : 'Add Message'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Cache Status:</span>
              <span className="text-sm font-medium">
                {messages.isFetching ? 'Fetching...' : 'Up to date'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Last Updated:</span>
              <span className="text-sm font-medium">
                {messages.dataUpdatedAt
                  ? new Date(messages.dataUpdatedAt).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Messages</h3>
          {messages.isLoading ? (
            <div>Loading messages...</div>
          ) : messages.error ? (
            <div className="text-destructive">Error: {messages.error.message}</div>
          ) : (
            <div className="space-y-2">
              {messages.data?.messages.map((message: any) => (
                <div key={message.id} className="p-4 rounded bg-muted">
                  <p>{message.content}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                    {message.id.startsWith('temp-') && ' (Optimistic)'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
