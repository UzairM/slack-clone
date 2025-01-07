'use client';

import { trpc } from '@/lib/trpc/client';
import { type AppRouter } from '@/server/api/root';
import { type TRPCClientErrorLike } from '@trpc/client';
import { useState } from 'react';

export function ApiTest() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Type-safe query using tRPC
  const hello = trpc.hello.useQuery(
    { name, age: parseInt(age) || 0 },
    {
      enabled: name.length > 0 && age.length > 0,
      onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
    }
  );

  // Type-safe mutation using tRPC
  const createMessage = trpc.message.create.useMutation({
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  const handleCreateMessage = () => {
    createMessage.mutate({
      content: 'Test message',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      channelId: '123e4567-e89b-12d3-a456-426614174001',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">tRPC Type Safety Test</h2>

      {/* Test Query */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-primary"
            placeholder="Enter name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Age:</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="input-primary"
            placeholder="Enter age"
          />
        </div>

        {hello.data && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Response:</p>
            <p className="text-sm text-muted-foreground">{hello.data.greeting}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Timestamp: {hello.data.timestamp.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Test Mutation */}
      <div className="space-y-4">
        <button
          onClick={handleCreateMessage}
          className="button-primary"
          disabled={createMessage.isLoading}
        >
          {createMessage.isLoading ? 'Creating...' : 'Create Test Message'}
        </button>

        {createMessage.data && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Created Message:</p>
            <p className="text-sm text-muted-foreground">ID: {createMessage.data.id}</p>
            <p className="text-sm text-muted-foreground">Content: {createMessage.data.content}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="text-sm font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
