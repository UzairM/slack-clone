'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PresenceInfo {
  presence: 'online' | 'offline' | 'unavailable';
  status_msg?: string;
  last_active_ago?: number;
  currently_active?: boolean;
}

export function PresenceSettings() {
  const { getUserPresence, setUserPresence } = useMatrixAuth();
  const [presence, setPresence] = useState<PresenceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load current presence
  useEffect(() => {
    const loadPresence = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const presenceData = await getUserPresence();
        setPresence(presenceData);
        setStatusMessage(presenceData.status_msg || '');
      } catch (err: any) {
        console.error('Failed to load presence:', err);
        setError(err.message || 'Failed to load presence');
      } finally {
        setIsLoading(false);
      }
    };

    loadPresence();
  }, [getUserPresence]);

  // Update presence
  const handleUpdatePresence = async (newPresence: 'online' | 'offline' | 'unavailable') => {
    try {
      setIsSaving(true);
      const result = await setUserPresence(newPresence, statusMessage);

      if (result.success) {
        setPresence(prev => ({
          ...prev!,
          presence: newPresence,
          status_msg: statusMessage,
        }));
        toast.success('Presence updated');
      } else {
        toast.error(result.error || 'Failed to update presence');
      }
    } catch (err: any) {
      console.error('Update presence error:', err);
      toast.error(err.message || 'Failed to update presence');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presence Settings</CardTitle>
        <CardDescription>Manage your online status and availability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={presence?.presence}
            onValueChange={value =>
              handleUpdatePresence(value as 'online' | 'offline' | 'unavailable')
            }
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="unavailable">Away</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status Message</label>
          <div className="flex gap-2">
            <Input
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              placeholder="What's on your mind?"
              disabled={isSaving}
            />
            <Button
              onClick={() => handleUpdatePresence(presence?.presence || 'online')}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </div>

        {presence?.last_active_ago && (
          <div className="text-sm text-muted-foreground">
            Last active:{' '}
            {presence.last_active_ago < 60000
              ? 'Just now'
              : `${Math.floor(presence.last_active_ago / 60000)} minutes ago`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
