'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, requestEmailVerification } = useMatrixAuth();
  const [email, setEmail] = useState('');
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams?.get('token');
  const sid = searchParams?.get('sid');

  // Handle email verification request
  const handleRequestVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsRequestingVerification(true);
      setError(null);
      const result = await requestEmailVerification(email);

      if (result.success) {
        toast.success('Verification email sent');
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err: any) {
      console.error('Email verification request error:', err);
      setError(err.message || 'Failed to send verification email');
    } finally {
      setIsRequestingVerification(false);
    }
  };

  // Handle email verification
  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token || !sid) return;

      try {
        setIsVerifying(true);
        setError(null);
        const result = await verifyEmail(token, sid);

        if (result.success) {
          toast.success('Email verified successfully');
          router.push('/settings/profile');
        } else {
          setError(result.error || 'Failed to verify email');
        }
      } catch (err: any) {
        console.error('Email verification error:', err);
        setError(err.message || 'Failed to verify email');
      } finally {
        setIsVerifying(false);
      }
    };

    if (token && sid) {
      verifyEmailToken();
    }
  }, [token, sid, verifyEmail, router]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          {token
            ? 'Verifying your email address...'
            : 'Enter your email address to verify your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!token && (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isRequestingVerification}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleRequestVerification}
              disabled={isRequestingVerification || !email}
            >
              {isRequestingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                'Send Verification Email'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
