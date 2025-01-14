import { useMatrix } from '@/hooks/use-matrix';
import { EventType, MatrixEvent } from 'matrix-js-sdk';
import { useCallback, useState } from 'react';

interface SearchResult {
  eventId: string;
  roomId: string;
  roomName: string;
  content: string;
  sender: string;
  timestamp: number;
  context?: {
    before: string[];
    after: string[];
  };
}

export function useMatrixSearch() {
  const { client } = useMatrix();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessages = useCallback(
    async (query: string) => {
      if (!client) {
        setError('Matrix client not initialized');
        return;
      }

      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setIsSearching(true);
        setError(null);

        // Get all rooms the user is in
        const rooms = client.getRooms();
        const searchResults: SearchResult[] = [];

        // Search through each room's timeline
        for (const room of rooms) {
          const timeline = room.getLiveTimeline();
          const events = timeline.getEvents();

          // Filter and process matching events
          const matchingEvents = events.filter((event: MatrixEvent) => {
            if (event.getType() !== EventType.RoomMessage || event.isRedacted()) return false;
            const content = event.getContent()?.body;
            if (!content) return false;
            return content.toLowerCase().includes(query.toLowerCase());
          });

          // Convert matching events to search results
          matchingEvents.forEach((event: MatrixEvent) => {
            const content = event.getContent()?.body;
            if (!content) return;

            // Get context (messages before and after)
            const eventIndex = events.indexOf(event);
            const context = {
              before: events
                .slice(Math.max(0, eventIndex - 2), eventIndex)
                .map(e => e.getContent()?.body || '')
                .filter(Boolean),
              after: events
                .slice(eventIndex + 1, eventIndex + 3)
                .map(e => e.getContent()?.body || '')
                .filter(Boolean),
            };

            searchResults.push({
              eventId: event.getId() || '',
              roomId: room.roomId,
              roomName: room.name || 'Unknown Room',
              content,
              sender: event.getSender() || 'Unknown',
              timestamp: event.getTs(),
              context,
            });
          });
        }

        // Sort results by timestamp (newest first)
        searchResults.sort((a, b) => b.timestamp - a.timestamp);

        setResults(searchResults);
      } catch (err: any) {
        setError(err.message || 'Failed to search messages');
      } finally {
        setIsSearching(false);
      }
    },
    [client]
  );

  const clearSearch = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    searchMessages,
    clearSearch,
  };
}
