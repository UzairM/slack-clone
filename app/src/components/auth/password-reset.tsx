'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function PasswordReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestPasswordResetToken, resetPassword } = useMatrixAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams?.get('token');

  // Request password reset token
  const handleRequestToken = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsRequestingToken(true);
      setError(null);
      const result = await requestPasswordResetToken(email);

      if (result.success) {
        toast.success('Password reset instructions sent to your email');
      } else {
        setError(result.error || 'Failed to request password reset');
      }
    } catch (err: any) {
      console.error('Password reset token request error:', err);
      setError(err.message || 'Failed to request password reset');
    } finally {
      setIsRequestingToken(false);
    }
  };

  // Reset password with token
  const handleResetPassword = async () => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsResettingPassword(true);
      setError(null);
      const result = await resetPassword(newPassword, token);

      if (result.success) {
        toast.success('Password reset successfully');
        router.push('/auth/login');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {token ? 'Enter your new password' : 'Enter your email to receive a password reset link'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {token ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isResettingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isResettingPassword}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleResetPassword}
              disabled={isResettingPassword || !newPassword || !confirmPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isRequestingToken}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleRequestToken}
              disabled={isRequestingToken || !email}
            >
              {isRequestingToken ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
