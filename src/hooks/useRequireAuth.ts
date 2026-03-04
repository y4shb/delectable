import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

/**
 * Hook that guards authenticated routes.
 * Reads auth state from AuthContext and redirects to /login if not authenticated.
 */
export function useRequireAuth(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

export default useRequireAuth;
