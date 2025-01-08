import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginData, loginSchema, loginUser } from '@/lib/matrix/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore(state => state.setSession);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isHydrated = useAuthStore(state => state.isHydrated);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      const from = searchParams.get('from');
      router.replace(from || '/chat');
    }
  }, [isAuthenticated, isHydrated, router, searchParams]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await loginUser(data);

      if (result.success && result.data) {
        // Store session in auth store with device ID
        setSession(result.data.access_token, result.data.user_id, result.data.device_id);

        // Force a hard navigation to the chat page
        const from = searchParams.get('from');
        window.location.href = from || '/chat';
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto backdrop-blur-[2px] bg-card/80 border-card/20">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-lg">Sign in to continue to ChatGenius</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }: { field: ControllerRenderProps<LoginData, 'username'> }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }: { field: ControllerRenderProps<LoginData, 'password'> }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          <Link href="/reset-password" className="text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
