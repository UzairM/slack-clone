'use client';

import { Message } from '@/components/chat/message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMatrixSearch } from '@/hooks/use-matrix-search';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { userId } = useAuthStore();
  const { results, isSearching, searchMessages } = useMatrixSearch();

  useEffect(() => {
    if (query) {
      searchMessages(query);
    }
  }, [query, searchMessages]);

  // Navigate to message
  const navigateToMessage = useCallback(
    (roomId: string, eventId: string) => {
      router.push(`/chat/${roomId}?highlight=${eventId}`);
    },
    [router]
  );

  if (!userId) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Search Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <span className="text-sm text-muted-foreground">for &quot;{query}&quot;</span>
        </div>
      </header>

      {/* Search Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map(result => (
                <div key={result.eventId} className="space-y-1">
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {result.roomName}
                    </span>
                  </div>
                  <button
                    onClick={() => navigateToMessage(result.roomId, result.eventId)}
                    className={cn(
                      'w-full transition-colors rounded-lg',
                      'hover:bg-[#AACFF3]/40 dark:hover:bg-muted/50'
                    )}
                  >
                    <Message
                      id={result.eventId}
                      content={result.content}
                      sender={result.sender}
                      timestamp={result.timestamp}
                      userId={userId}
                      status="sent"
                      type="m.text"
                      className="border border-border dark:border-border-dark rounded-md"
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
