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
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
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
          <div className="text-sm text-center">
            <a href="/register" className="font-medium text-primary hover:text-blue-500">
              Don&apos;t have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() { return <React.Suspense fallback={<div>Loading...</div>}><LoginContent /></React.Suspense>; }
