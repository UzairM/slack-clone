'use client';

import { RoomSidebar } from '@/components/chat/room-sidebar';
import { useMatrix } from '@/hooks/use-matrix';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { isInitialized } = useMatrix();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Show loading state
  if (isAuthLoading || !isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show chat interface
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <RoomSidebar className="shrink-0" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
