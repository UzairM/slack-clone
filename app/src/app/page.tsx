'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatrix } from '@/hooks/use-matrix';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { client, isInitialized } = useMatrix();

  useEffect(() => {
    if (isInitialized && client) {
      router.push('/chat');
    }
  }, [isInitialized, client, router]);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5">
      <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/20" />
      <div className="container relative flex items-center justify-center min-h-screen py-12 px-4">
        <Card className="w-full max-w-md mx-auto backdrop-blur-[2px] bg-card/80 border-card/20">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Welcome to ChatGenius
            </CardTitle>
            <CardDescription className="text-lg">
              Your intelligent workplace communication platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <Link href="/login" className="block">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300"
              >
                Create account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
