'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetchApi<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
        requireAuth: false,
      });

      login(res.data.accessToken, res.data.user);

      if (res.data.user.role === 'ADMIN') router.push('/venues');
      else if (res.data.user.role === 'ORGANISER') router.push('/dashboard');
      else router.push('/events');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-card glass-card-static p-8 animate-float-in">
        <div>
          <p className="micro-label text-center mb-2">Get started</p>
          <h2 className="text-center text-3xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">
            Create an account
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
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
              <select
                className="glass-input block w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CUSTOMER" className="bg-slate-900 text-white">Customer</option>
                <option value="ORGANISER" className="bg-slate-900 text-white">Event Organiser</option>
                <option value="ADMIN" className="bg-slate-900 text-white">System Admin</option>
              </select>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Register
            </Button>
          </div>
          <div className="text-sm text-center text-[var(--text-muted)]">
            <a href="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
