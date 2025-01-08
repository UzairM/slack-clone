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
import { Input } from '@/components/ui/input';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Laptop2, Loader2, Smartphone, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DeviceInfo {
  device_id: string;
  display_name?: string;
  last_seen_ip?: string;
  last_seen_ts?: number;
}

export function DeviceManagement() {
  const {
    getDevices,
    deleteDevice,
    updateDeviceDisplayName,
    deviceId: currentDeviceId,
  } = useMatrixAuth();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');

  // Load devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const deviceList = await getDevices();
        setDevices(deviceList);
      } catch (err: any) {
        console.error('Failed to load devices:', err);
        setError(err.message || 'Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [getDevices]);

  // Handle device deletion
  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;

    try {
      setIsDeleting(true);
      const result = await deleteDevice(selectedDevice.device_id, password);

      if (result.success) {
        setDevices(devices.filter(d => d.device_id !== selectedDevice.device_id));
        toast.success('Device deleted successfully');
        setShowDeleteDialog(false);
        setSelectedDevice(null);
        setPassword('');
      } else {
        toast.error(result.error || 'Failed to delete device');
      }
    } catch (err: any) {
      console.error('Delete device error:', err);
      toast.error(err.message || 'Failed to delete device');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle display name update
  const handleUpdateDisplayName = async (deviceId: string) => {
    if (!newDisplayName) return;

    try {
      const result = await updateDeviceDisplayName(newDisplayName);

      if (result.success) {
        setDevices(
          devices.map(d => (d.device_id === deviceId ? { ...d, display_name: newDisplayName } : d))
        );
        toast.success('Device name updated');
        setEditingName(null);
        setNewDisplayName('');
      } else {
        toast.error(result.error || 'Failed to update device name');
      }
    } catch (err: any) {
      console.error('Update device name error:', err);
      toast.error(err.message || 'Failed to update device name');
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
          <CardDescription>Manage your logged-in devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.map(device => (
            <div
              key={device.device_id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                {device.device_id === currentDeviceId ? (
                  <Laptop2 className="h-8 w-8 text-primary" />
                ) : (
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  {editingName === device.device_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newDisplayName}
                        onChange={e => setNewDisplayName(e.target.value)}
                        placeholder="Enter device name"
                        className="w-48"
                      />
                      <Button size="sm" onClick={() => handleUpdateDisplayName(device.device_id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingName(null);
                          setNewDisplayName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        setEditingName(device.device_id);
                        setNewDisplayName(device.display_name || '');
                      }}
                    >
                      {device.display_name || device.device_id}{' '}
                      {device.device_id === currentDeviceId && '(Current)'}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {device.last_seen_ip && `Last seen from ${device.last_seen_ip}`}
                    {device.last_seen_ts && ` at ${new Date(device.last_seen_ts).toLocaleString()}`}
                  </div>
                </div>
              </div>
              {device.device_id !== currentDeviceId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedDevice(device);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedDevice(null);
                setPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDevice}
              disabled={!password || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Device'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
