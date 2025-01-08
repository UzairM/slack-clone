'use client';

import { Button } from '@/components/ui/button';
import { useMatrixAuth } from '@/hooks/use-matrix-auth';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function LogoutButton({ variant = 'default', className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { logout } = useMatrixAuth();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const result = await logout();

      if (result.success) {
        // Force a hard navigation to the login page
        window.location.href = '/login';
      } else {
        toast.error(result.error || 'Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
