'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[rgba(15,23,42,0.92)] backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-xl text-white font-semibold tracking-tight">TicketPro</a>
        <nav className="flex items-center space-x-4">
          <a href="/events" className="text-white/40 hover:text-white/80 transition-colors text-sm">Events</a>

          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <a href="/bookings" className="text-white/40 hover:text-white/80 transition-colors text-sm">My Bookings</a>
              )}
              {user.role === 'ORGANISER' && (
                <>
                  <a href="/dashboard" className="text-white/40 hover:text-white/80 transition-colors text-sm">Dashboard</a>
                  <a href="/events/create" className="text-white/40 hover:text-white/80 transition-colors text-sm">Create Event</a>
                </>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <a href="/venues" className="text-white/40 hover:text-white/80 transition-colors text-sm">Venues</a>
                  <a href="/stats" className="text-white/40 hover:text-white/80 transition-colors text-sm">Stats</a>
                </>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium hover:scale-110 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all">
                  {user.name ? user.name.charAt(0).toUpperCase() : ''}
                </div>
                <span className="text-white/50 text-sm">{user.name}</span>
              </div>
              <Button variant="ghost" onClick={logout} className="text-sm">Logout</Button>
            </>
          ) : (
            <>
              <a href="/login" className="text-white/40 hover:text-white/80 transition-colors text-sm">Login</a>
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
