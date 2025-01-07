import { RedisTest } from '@/components/test/redis-test';

export default function RedisTestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Redis Test Page</h1>
      <RedisTest />
    </main>
  );
}
