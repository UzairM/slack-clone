import { PrismaTest } from '@/components/test/prisma-test';

export default function PrismaTestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prisma Test</h1>
      <PrismaTest />
    </main>
  );
}
