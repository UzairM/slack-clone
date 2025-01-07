'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12', className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Channels
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start"
            >
              <Link
                href="/channels/general"
                className={cn(
                  'w-full',
                  pathname === '/channels/general' &&
                    'bg-accent text-accent-foreground'
                )}
              >
                # general
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Direct Messages
          </h2>
          <div className="space-y-1">
            {/* We'll populate this with actual DMs later */}
            <Button
              variant="ghost"
              className="w-full justify-start opacity-60"
              disabled
            >
              No direct messages yet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
