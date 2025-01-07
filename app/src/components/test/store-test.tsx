'use client';

import { useChannelStore, useUIStore, useUserStore } from '@/lib/store';
import { User } from '@/lib/store/user-store';
import { useEffect, useState } from 'react';

export function StoreTest() {
  const [mounted, setMounted] = useState(false);

  // User store
  const { user, setUser, setStatus, setCustomStatus, logout } = useUserStore();

  // Channel store
  const { channels, activeChannel, setChannels, setActiveChannel } = useChannelStore();

  // UI store
  const { isSidebarOpen, toggleSidebar, isLoading, setLoading } = useUIStore();

  // Test hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Test user store updates
  const handleUpdateUser = () => {
    const testUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'online',
    };
    setUser(testUser);
  };

  const handleUpdateStatus = () => {
    setStatus('busy');
  };

  const handleUpdateCustomStatus = () => {
    setCustomStatus('In a meeting');
  };

  // Test channel store updates
  const handleAddChannel = () => {
    const newChannel = {
      id: Date.now().toString(),
      name: 'Test Channel',
      type: 'public' as const,
      members: [],
      unreadCount: 0,
    };
    setChannels([...channels, newChannel]);
    setActiveChannel(newChannel);
  };

  // Test UI store updates
  const handleToggleLoading = () => {
    setLoading(!isLoading);
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Store Test</h2>
        <div className="space-x-2">
          <button
            onClick={handleUpdateUser}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Set User
          </button>
          <button
            onClick={handleUpdateStatus}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Update Status
          </button>
          <button
            onClick={handleUpdateCustomStatus}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Update Custom Status
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
          >
            Logout
          </button>
        </div>
        <pre className="p-4 bg-muted rounded-lg overflow-auto">
          {JSON.stringify({ user }, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Channel Store Test</h2>
        <div className="space-x-2">
          <button
            onClick={handleAddChannel}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Add Channel
          </button>
        </div>
        <pre className="p-4 bg-muted rounded-lg overflow-auto">
          {JSON.stringify({ channels, activeChannel }, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">UI Store Test</h2>
        <div className="space-x-2">
          <button
            onClick={toggleSidebar}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Toggle Sidebar
          </button>
          <button
            onClick={handleToggleLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Toggle Loading
          </button>
        </div>
        <pre className="p-4 bg-muted rounded-lg overflow-auto">
          {JSON.stringify({ isSidebarOpen, isLoading }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
