'use client';

import { LogoutButton } from '@/components/auth/logout-button';
import { RoomSidebar } from '@/components/chat/room-sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useMatrix } from '@/hooks/use-matrix';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold text-foreground">ChatGenius</div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted transition-colors"
              asChild
            >
              <Link href="/chat" title="Chat">
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`hover:bg-muted transition-colors ${pathname === '/settings' ? 'bg-muted' : ''}`}
              asChild
            >
              <Link href="/settings" title="Settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
            <LogoutButton variant="ghost" className="hover:bg-muted transition-colors" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <RoomSidebar className="shrink-0" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
