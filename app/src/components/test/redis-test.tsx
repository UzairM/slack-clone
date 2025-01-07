'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';

export function RedisTest() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState('60');
  const [getKey, setGetKey] = useState('');

  // Test Redis operations
  const redisOps = trpc.redis.test.useMutation();
  const redisStatus = trpc.redis.status.useQuery(undefined, {
    refetchInterval: 1000,
  });
  const getCacheValue = trpc.redis.get.useQuery(
    { key: getKey },
    {
      enabled: !!getKey,
      refetchInterval: 1000,
    }
  );

  const handleTest = async () => {
    if (!key.trim() || !value.trim()) return;
    await redisOps.mutateAsync({
      key,
      value,
      ttl: parseInt(ttl),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Redis Connection Test</h2>
        <div className="p-4 bg-muted rounded">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Status:</span>
            <span className={redisStatus.data?.connected ? 'text-green-500' : 'text-red-500'}>
              {redisStatus.data?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {redisStatus.data?.info && (
            <div className="mt-2 text-sm text-muted-foreground">
              <pre>{JSON.stringify(redisStatus.data.info, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Test Cache Operations</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Cache Key"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Cache Value"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="number"
            value={ttl}
            onChange={e => setTtl(e.target.value)}
            placeholder="TTL in seconds"
            className="w-full px-4 py-2 border rounded"
          />
          <button
            onClick={handleTest}
            disabled={redisOps.isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {redisOps.isLoading ? 'Testing...' : 'Test Cache'}
          </button>
        </div>

        {redisOps.data && (
          <div className="p-4 bg-muted rounded">
            <h4 className="font-medium">Test Results:</h4>
            <pre className="mt-2 text-sm">{JSON.stringify(redisOps.data, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Get Cache Value</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={getKey}
            onChange={e => setGetKey(e.target.value)}
            placeholder="Enter key to get value"
            className="w-full px-4 py-2 border rounded"
          />
          {getCacheValue.data && (
            <div className="p-4 bg-muted rounded">
              <h4 className="font-medium">Cache Value:</h4>
              <pre className="mt-2 text-sm">{JSON.stringify(getCacheValue.data, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
