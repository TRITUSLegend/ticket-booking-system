'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from './api-client';
import { disconnectSocket, getSocket } from './socket-client';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ORGANISER' | 'ADMIN';
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          getSocket(); // Init socket connection if token exists
        } catch (e) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    if (!user && (pathname.includes('/dashboard') || pathname.includes('/venues/create') || pathname.includes('/checkout'))) {
      router.push('/login');
    }

    if (user) {
      if (pathname.includes('/venues') && user.role !== 'ADMIN') router.push('/');
      if (pathname.includes('/dashboard') && user.role !== 'ORGANISER') router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    getSocket();
  };

  const logout = async () => {
    try {
      await fetchApi<any>('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      disconnectSocket();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
