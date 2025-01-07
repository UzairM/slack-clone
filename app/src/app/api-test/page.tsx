import { ApiTest } from '@/components/test/api-test';

export default function ApiTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">API Type Safety Test</h1>
      <ApiTest />
    </div>
  );
}
