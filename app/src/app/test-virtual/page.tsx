import { VirtualTest } from '@/components/test/virtual-test';

export default function VirtualTestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Virtual Scroll Test</h1>
      <VirtualTest />
    </main>
  );
}
