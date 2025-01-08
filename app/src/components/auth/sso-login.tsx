'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function SsoLogin() {
  const router = useRouter();
  const { getSsoLoginUrl, completeSsoLogin, getLoginFlows } = useMatrixAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSsoFlow, setHasSsoFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if SSO is available
  useEffect(() => {
    const checkSsoAvailability = async () => {
      try {
        setIsLoading(true);
        const flows = await getLoginFlows();
        setHasSsoFlow(flows.hasSsoFlow);
      } catch (err: any) {
        console.error('Failed to check SSO availability:', err);
        toast.error(err.message || 'Failed to check SSO availability');
      } finally {
        setIsLoading(false);
      }
    };

    checkSsoAvailability();
  }, [getLoginFlows]);

  // Handle SSO login
  const handleSsoLogin = async () => {
    try {
      setIsProcessing(true);
      const redirectUrl = `${window.location.origin}/auth/sso-callback`;
      const ssoUrl = getSsoLoginUrl(redirectUrl);
      window.location.href = ssoUrl;
    } catch (err: any) {
      console.error('SSO login error:', err);
      toast.error(err.message || 'Failed to initiate SSO login');
      setIsProcessing(false);
    }
  };

  // Handle SSO callback
  useEffect(() => {
    const handleSsoCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const loginToken = params.get('loginToken');

      if (loginToken) {
        try {
          setIsProcessing(true);
          const result = await completeSsoLogin(loginToken);

          if (result.success) {
            toast.success('Successfully logged in');
            router.push('/');
          } else {
            toast.error(result.error || 'Failed to complete SSO login');
          }
        } catch (err: any) {
          console.error('SSO callback error:', err);
          toast.error(err.message || 'Failed to complete SSO login');
        } finally {
          setIsProcessing(false);
        }
      }
    };

    if (window.location.pathname === '/auth/sso-callback') {
      handleSsoCallback();
    }
  }, [completeSsoLogin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSsoFlow) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Single Sign-On</CardTitle>
        <CardDescription>Continue with your organization's login</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleSsoLogin} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            'Continue with SSO'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
