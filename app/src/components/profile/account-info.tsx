'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useMatrix } from '@/hooks/use-matrix';
import type { IMyDevice } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';

type AccountDetails = {
  userId: string;
  homeServer: string;
  deviceId: string;
  createdAt: string;
  lastActive: string;
  verifiedDevices: number;
};

export default function AccountInfo() {
  const { client } = useMatrix();
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!client) return;

      try {
        const devices = await client.getDevices();
        const verifiedDevices = devices.devices.filter(
          (d: IMyDevice) => d.device_id && d.display_name
        ).length;
        const userId = client.getUserId() || '';
        const deviceId = client.getDeviceId() || '';
        const homeServer = client.getHomeserverUrl() || '';

        // Note: These would need to be implemented based on your Matrix server configuration
        // The actual implementation might differ
        const createdAt = new Date().toISOString(); // Placeholder
        const lastActive = new Date().toISOString(); // Placeholder

        setAccountDetails({
          userId,
          homeServer,
          deviceId,
          createdAt,
          lastActive,
          verifiedDevices,
        });
      } catch (error) {
        console.error('Failed to fetch account details:', error);
      }
    };

    fetchAccountDetails();
  }, [client]);

  if (!accountDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Loading account details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>View your account details and information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Matrix ID</Label>
            <p className="text-sm text-muted-foreground font-mono">{accountDetails.userId}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Home Server</Label>
            <p className="text-sm text-muted-foreground font-mono">{accountDetails.homeServer}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Device ID</Label>
            <p className="text-sm text-muted-foreground font-mono">{accountDetails.deviceId}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Account Created</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(accountDetails.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Active</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(accountDetails.lastActive).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Verified Devices</Label>
            <p className="text-sm text-muted-foreground">
              {accountDetails.verifiedDevices} device(s)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
