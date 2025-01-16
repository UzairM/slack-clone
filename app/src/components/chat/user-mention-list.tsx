import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface UserMentionListProps {
  users: {
    userId: string;
    displayName?: string;
    avatarUrl?: string;
  }[];
  selectedIndex: number;
  onSelect: (user: { userId: string; displayName?: string }) => void;
  className?: string;
}

export function UserMentionList({
  users,
  selectedIndex,
  onSelect,
  className,
}: UserMentionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  if (!users.length) return null;

  return (
    <div
      ref={listRef}
      className={cn(
        'absolute z-50 max-h-[200px] w-[200px] overflow-y-auto rounded-md border bg-popover p-1 shadow-md',
        className
      )}
    >
      {users.map((user, index) => {
        const isSelected = index === selectedIndex;
        const displayName = user.displayName || user.userId.split(':')[0].substring(1);

        return (
          <button
            key={user.userId}
            ref={isSelected ? selectedRef : null}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
              'hover:bg-accent hover:text-accent-foreground',
              isSelected && 'bg-accent text-accent-foreground'
            )}
            onClick={() => onSelect(user)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate">{displayName}</span>
          </button>
        );
      })}
    </div>
  );
}
