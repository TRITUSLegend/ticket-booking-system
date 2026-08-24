'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/Button';

function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <a
      href={href}
      className={`text-sm pb-0.5 border-b transition-colors ${
        isActive
          ? 'text-white border-[var(--accent-primary)]'
          : 'text-white/40 border-transparent hover:text-white/80'
      }`}
    >
      {label}
    </a>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname() || '';

  const isActive = (href: string) =>
    href === '/events' ? pathname === '/events' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-[rgba(15,23,42,0.85)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-xl text-white font-semibold tracking-tight">TicketPro</a>
        <nav className="flex items-center space-x-4">
          <NavLink href="/events" label="Events" isActive={isActive('/events')} />

          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <NavLink href="/bookings" label="My Bookings" isActive={isActive('/bookings')} />
              )}
              {user.role === 'ORGANISER' && (
                <>
                  <NavLink href="/dashboard" label="Dashboard" isActive={isActive('/dashboard')} />
                  <NavLink href="/events/create" label="Create Event" isActive={isActive('/events/create')} />
                </>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <NavLink href="/venues" label="Venues" isActive={isActive('/venues')} />
                  <NavLink href="/stats" label="Stats" isActive={isActive('/stats')} />
                </>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-purple)] flex items-center justify-center text-white text-xs font-medium hover:scale-110 hover:shadow-glow-purple transition-transform duration-150">
                  {user.name ? user.name.charAt(0).toUpperCase() : ''}
                </div>
                <span className="text-white/50 text-sm">{user.name}</span>
              </div>
              <Button variant="ghost" onClick={logout} className="text-sm">Logout</Button>
            </>
          ) : (
            <>
              <NavLink href="/login" label="Login" isActive={isActive('/login')} />
              <a href="/register">
                <Button className="text-sm">Register</Button>
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
