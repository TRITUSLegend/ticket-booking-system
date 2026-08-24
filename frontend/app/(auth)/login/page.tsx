'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetchApi<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      login(res.data.accessToken, res.data.user);

      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else {
        if (res.data.user.role === 'ADMIN') router.push('/venues');
        else if (res.data.user.role === 'ORGANISER') router.push('/dashboard');
        else router.push('/events');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-card glass-card-static p-8 animate-float-in">
        <div>
          <p className="micro-label text-center mb-2">Welcome back</p>
          <h2 className="text-center text-3xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center rounded-lg p-3">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </div>
          <div className="text-sm text-center text-[var(--text-muted)]">
            <a href="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Don&apos;t have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() { return <React.Suspense fallback={<div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>}><LoginContent /></React.Suspense>; }
