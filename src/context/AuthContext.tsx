import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { User } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import api, { setAccessToken } from '../api/client';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // On mount, try to restore session via the refresh-token cookie
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { data: refreshData } = await api.post('/auth/refresh/');
        if (cancelled) return;
        setAccessToken(refreshData.access);

        const { data: me } = await api.get('/auth/me/');
        if (cancelled) return;
        setUser(me);
      } catch {
        // No valid refresh token — user needs to log in
        setAccessToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login/', { email, password });
    setAccessToken(data.access);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (
      email: string,
      name: string,
      password: string,
      passwordConfirm: string,
    ) => {
      const { data } = await api.post('/auth/register/', {
        email,
        name,
        password,
        passwordConfirm,
      });
      setAccessToken(data.access);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // best effort
    }
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
