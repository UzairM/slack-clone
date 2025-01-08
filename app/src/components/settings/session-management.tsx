'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Globe, Laptop2, Loader2, LogOut, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SessionInfo {
  device_id: string;
  display_name?: string;
  last_seen_ip?: string;
  last_seen_ts?: number;
  user_agent?: string;
}

export function SessionManagement() {
  const { getDevices, logout, deviceId: currentDeviceId } = useMatrixAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [logoutEverywhere, setLogoutEverywhere] = useState(false);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const devices = await getDevices();
        setSessions(devices);
      } catch (err: any) {
        console.error('Failed to load sessions:', err);
        setError(err.message || 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [getDevices]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const result = await logout(logoutEverywhere);

      if (result.success) {
        toast.success(
          logoutEverywhere ? 'Logged out from all devices' : 'Logged out from current device'
        );
        setShowLogoutDialog(false);
      } else {
        toast.error(result.error || 'Failed to logout');
      }
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error(err.message || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get device icon based on user agent
  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe className="h-8 w-8 text-muted-foreground" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('ios')) {
      return <Smartphone className="h-8 w-8 text-muted-foreground" />;
    }
    return <Laptop2 className="h-8 w-8 text-muted-foreground" />;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across different devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map(session => (
            <div
              key={session.device_id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                {getDeviceIcon(session.user_agent)}
                <div>
                  <div className="font-medium">
                    {session.display_name || session.device_id}{' '}
                    {session.device_id === currentDeviceId && '(Current)'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.last_seen_ip && `Last seen from ${session.last_seen_ip}`}
                    {session.last_seen_ts &&
                      ` at ${new Date(session.last_seen_ts).toLocaleString()}`}
                  </div>
                  {session.user_agent && (
                    <div className="text-xs text-muted-foreground mt-1">{session.user_agent}</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Choose whether to sign out from this device or all devices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="logout-everywhere"
                checked={logoutEverywhere}
                onChange={e => setLogoutEverywhere(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="logout-everywhere">Sign out from all devices</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowLogoutDialog(false);
                setLogoutEverywhere(false);
              }}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
