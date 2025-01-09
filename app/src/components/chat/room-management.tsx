'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useMatrix } from '@/hooks/use-matrix';
import { useMatrixRooms } from '@/hooks/use-matrix-rooms';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RoomDiscovery } from './room-discovery';

interface RoomManagementProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type RoomType = 'public' | 'private' | 'direct';

export function RoomManagement({ className, isOpen, onOpenChange }: RoomManagementProps) {
  const { client } = useMatrix();
  const { createPublicRoom, createPrivateRoom, createDirectMessage } = useMatrixRooms();
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('public');
  const [inviteUsers, setInviteUsers] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ userId: string; displayName: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchUsers = async (term: string) => {
    if (!client || !term) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await client.searchUserDirectory({ term });
      setSearchResults(
        response.results.map(user => ({
          userId: user.user_id,
          displayName: user.display_name || user.user_id,
        }))
      );
    } catch (error) {
      console.error('Failed to search users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() && roomType !== 'direct') {
      toast.error('Please enter a room name');
      return;
    }

    if (roomType === 'direct' && !selectedUserId) {
      toast.error('Please select a user to message');
      return;
    }

    try {
      setIsCreating(true);

      let roomId;
      switch (roomType) {
        case 'public':
          roomId = await createPublicRoom(roomName, roomTopic);
          break;
        case 'private':
          const userIds = inviteUsers
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);
          roomId = await createPrivateRoom(roomName, userIds);
          break;
        case 'direct':
          roomId = await createDirectMessage(selectedUserId);
          break;
      }

      toast.success('Room created successfully');
      onOpenChange?.(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(error.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setRoomName('');
    setRoomTopic('');
    setRoomType('public');
    setInviteUsers('');
    setSelectedUserId('');
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className={cn('space-y-4', className, !isOpen && 'hidden')}>
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover Rooms</TabsTrigger>
          <TabsTrigger value="create">Create Room</TabsTrigger>
        </TabsList>
        <TabsContent value="discover" className="mt-4">
          <RoomDiscovery />
        </TabsContent>
        <TabsContent value="create">
          <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new room</DialogTitle>
                <DialogDescription>
                  Create a new room or start a direct message conversation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={roomType} onValueChange={value => setRoomType(value as RoomType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Public Room
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Private Room
                        </div>
                      </SelectItem>
                      <SelectItem value="direct">
                        <div className="flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Direct Message
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {roomType !== 'direct' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Room Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter room name"
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                      />
                    </div>

                    {roomType === 'public' && (
                      <div className="space-y-2">
                        <Label htmlFor="topic">Room Topic (Optional)</Label>
                        <Textarea
                          id="topic"
                          placeholder="Enter room topic"
                          value={roomTopic}
                          onChange={e => setRoomTopic(e.target.value)}
                        />
                      </div>
                    )}

                    {roomType === 'private' && (
                      <div className="space-y-2">
                        <Label htmlFor="inviteUsers">
                          Invite Users (Optional, comma-separated user IDs)
                        </Label>
                        <Input
                          id="inviteUsers"
                          placeholder="@user1:domain.com, @user2:domain.com"
                          value={inviteUsers}
                          onChange={e => setInviteUsers(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                {roomType === 'direct' && (
                  <div className="space-y-2">
                    <Label htmlFor="userSearch">Search Users</Label>
                    <Input
                      id="userSearch"
                      placeholder="Search by username or ID"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                    />
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <ScrollArea className="h-[200px] rounded-md border">
                        <div className="space-y-2 p-4">
                          {searchResults.map(user => (
                            <div
                              key={user.userId}
                              className={cn(
                                'flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-muted/50',
                                selectedUserId === user.userId && 'bg-muted'
                              )}
                              onClick={() => setSelectedUserId(user.userId)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.displayName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {user.userId}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : searchTerm && !isSearching ? (
                      <div className="text-sm text-muted-foreground">No users found</div>
                    ) : null}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRoom} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
