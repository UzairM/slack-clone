'use client';

import { ProtectedLayout } from '@/components/layouts/protected-layout';

export default function ChatPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-muted-foreground">Your messages will appear here.</p>
      </div>
    </ProtectedLayout>
  );
}
