import { useSession } from '@/lib/matrix/session';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useSessionValidation = (shouldRedirect = true) => {
  const router = useRouter();
  const { isAuthenticated, validateSession } = useSession();

  useEffect(() => {
    const validate = async () => {
      const isValid = await validateSession();

      if (!isValid && shouldRedirect) {
        router.push('/login');
      }
    };

    // Validate on mount and set up interval
    validate();
    const interval = setInterval(validate, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [validateSession, router, shouldRedirect]);

  return { isAuthenticated };
};
