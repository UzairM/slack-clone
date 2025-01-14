import { useMatrixSearch } from '@/hooks/use-matrix-search';
import { cn } from '@/lib/utils';
import { Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

export function MessageSearch() {
  const router = useRouter();
  const { results, isSearching, searchMessages, clearSearch } = useMatrixSearch();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFullSearch, setIsFullSearch] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!isFullSearch) {
      const timer = setTimeout(() => {
        if (query.trim()) {
          searchMessages(query);
        } else {
          clearSearch();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [query, searchMessages, clearSearch, isFullSearch]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  // Navigate to message
  const navigateToMessage = useCallback(
    (roomId: string, eventId: string) => {
      router.push(`/chat/${roomId}?highlight=${eventId}`);
      setIsOpen(false);
      setQuery('');
      setIsFullSearch(false);
    },
    [router]
  );

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsFullSearch(true);
      setIsOpen(false);
      router.push(`/chat/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
              setIsFullSearch(false);
            }}
            onKeyDown={handleKeyDown}
            className="pl-8"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1.5 h-7 w-7 p-0"
              onClick={() => {
                setQuery('');
                clearSearch();
                setIsFullSearch(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && !isFullSearch && (query || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-lg border bg-popover/95 backdrop-blur-sm shadow-lg">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map(result => (
                    <button
                      key={result.eventId}
                      onClick={() => navigateToMessage(result.roomId, result.eventId)}
                      className={cn(
                        'w-full rounded-lg p-3 text-left transition-all',
                        'hover:bg-[#AACFF3]/40 dark:hover:bg-muted/50',
                        'focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm truncate">
                              {result.roomName}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTimestamp(result.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm truncate">
                            <span className="font-medium text-primary/90">
                              {result.sender.split(':')[0].substring(1)}:
                            </span>{' '}
                            <span className="text-muted-foreground/90">{result.content}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No messages found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
