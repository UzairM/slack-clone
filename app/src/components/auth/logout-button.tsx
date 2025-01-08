'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function LogoutButton({ variant = 'ghost', size = 'icon', className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const clearSession = useAuthStore(state => state.clearSession);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await clearSession();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
