import { LogoutButton } from '@/components/auth/logout-button';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation and buttons */}
      <header className="fixed top-0 right-0 left-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            ChatGenius
          </div>

          <div className="flex items-center gap-2">
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
            <LogoutButton variant="ghost" className="hover:bg-muted transition-colors" />
          </div>
        </div>
      </header>

      {/* Main content with padding for header */}
      <main className="container pt-16">{children}</main>
    </div>
  );
}
