'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';

export function PrismaTest() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [channelName, setChannelName] = useState('');
  const [messageContent, setMessageContent] = useState('');

  // Queries
  const users = trpc.user.list.useQuery();
  const channels = trpc.channel.list.useQuery();
  const messages = trpc.message.list.useQuery({ limit: 10 });

  // Mutations
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      users.refetch();
      setUserName('');
      setUserEmail('');
    },
  });

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      users.refetch();
      channels.refetch();
      messages.refetch();
    },
  });

  const createChannel = trpc.channel.create.useMutation({
    onSuccess: () => {
      channels.refetch();
      setChannelName('');
    },
  });

  const deleteChannel = trpc.channel.delete.useMutation({
    onSuccess: () => {
      channels.refetch();
      messages.refetch();
    },
  });

  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      messages.refetch();
      setMessageContent('');
    },
  });

  const handleCreateUser = () => {
    if (!userName.trim() || !userEmail.trim()) return;
    createUser.mutate({ name: userName, email: userEmail });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure? This will delete all related data.')) {
      deleteUser.mutate(userId);
    }
  };

  const handleCreateChannel = () => {
    if (!channelName.trim() || !users.data?.[0]) return;
    createChannel.mutate({
      name: channelName,
      type: 'public',
      ownerId: users.data[0].id,
    });
  };

  const handleDeleteChannel = (channelId: string) => {
    if (confirm('Are you sure? This will delete all messages in the channel.')) {
      deleteChannel.mutate(channelId);
    }
  };

  const handleCreateMessage = () => {
    if (!messageContent.trim() || !users.data?.[0] || !channels.data?.[0]) return;
    createMessage.mutate({
      content: messageContent,
      channelId: channels.data[0].id,
      authorId: users.data[0].id,
    });
  };

  return (
    <div className="space-y-8">
      {/* User Creation */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Name"
            className="px-4 py-2 border rounded"
          />
          <input
            type="email"
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            placeholder="Email"
            className="px-4 py-2 border rounded"
          />
          <button
            onClick={handleCreateUser}
            disabled={createUser.isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {createUser.isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
        <div className="space-y-2">
          {users.isLoading ? (
            <div>Loading users...</div>
          ) : users.error ? (
            <div className="text-destructive">Error: {users.error.message}</div>
          ) : (
            <div className="space-y-2">
              {users.data?.map(user => (
                <div
                  key={user.id}
                  className="p-4 bg-muted rounded flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleteUser.isLoading}
                    className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Channel Creation */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Channels</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            placeholder="Channel Name"
            className="px-4 py-2 border rounded"
          />
          <button
            onClick={handleCreateChannel}
            disabled={createChannel.isLoading || !users.data?.length}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {createChannel.isLoading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
        <div className="space-y-2">
          {channels.isLoading ? (
            <div>Loading channels...</div>
          ) : channels.error ? (
            <div className="text-destructive">Error: {channels.error.message}</div>
          ) : (
            <div className="space-y-2">
              {channels.data?.map(channel => (
                <div
                  key={channel.id}
                  className="p-4 bg-muted rounded flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-muted-foreground">Type: {channel.type}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    disabled={deleteChannel.isLoading}
                    className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Creation */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Messages</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={messageContent}
            onChange={e => setMessageContent(e.target.value)}
            placeholder="Message Content"
            className="px-4 py-2 border rounded flex-1"
          />
          <button
            onClick={handleCreateMessage}
            disabled={createMessage.isLoading || !users.data?.length || !channels.data?.length}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {createMessage.isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
        <div className="space-y-2">
          {messages.isLoading ? (
            <div>Loading messages...</div>
          ) : messages.error ? (
            <div className="text-destructive">Error: {messages.error.message}</div>
          ) : (
            <div className="space-y-2">
              {messages.data?.messages.map(message => (
                <div key={message.id} className="p-4 bg-muted rounded">
                  <div className="font-medium">{message.content}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
