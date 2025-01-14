'use client';

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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AccountSettings() {
  const { changePassword, deactivateAccount } = useMatrixAuth();
  const { accessToken } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [eraseData, setEraseData] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);
      const result = await deactivateAccount(deactivatePassword, eraseData);

      if (result.success) {
        toast.success('Account deactivated successfully');
        setShowDeactivateDialog(false);
      } else {
        toast.error(result.error || 'Failed to deactivate account');
      }
    } catch (err: any) {
      console.error('Account deactivation error:', err);
      toast.error(err.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handle copying access token
  const handleCopyToken = () => {
    if (accessToken) {
      navigator.clipboard.writeText(accessToken);
      toast.success('Access token copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Access Token</CardTitle>
          <CardDescription>Your Matrix access token for API access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input type="text" value={accessToken || ''} readOnly className="pr-10" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={handleCopyToken}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep this token secure. It provides full access to your account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              disabled={isChangingPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={isChangingPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isChangingPassword}
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Actions here can permanently affect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeactivateDialog(true)}>
            Deactivate Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account will be permanently deactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deactivate-password">Enter your password to confirm</Label>
              <Input
                id="deactivate-password"
                type="password"
                value={deactivatePassword}
                onChange={e => setDeactivatePassword(e.target.value)}
                disabled={isDeactivating}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="erase-data"
                checked={eraseData}
                onCheckedChange={setEraseData}
                disabled={isDeactivating}
              />
              <Label htmlFor="erase-data">Erase all my data (messages, files, etc.)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeactivateDialog(false);
                setDeactivatePassword('');
                setEraseData(false);
              }}
              disabled={isDeactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating || !deactivatePassword}
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
