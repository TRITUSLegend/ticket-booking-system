'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="font-bold text-xl text-primary">TicketPro</a>
        <nav className="flex items-center space-x-4">
          <a href="/events" className="text-gray-600 hover:text-gray-900 text-sm">Events</a>

          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <a href="/bookings" className="text-gray-600 hover:text-gray-900 text-sm">My Bookings</a>
              )}
              {user.role === 'ORGANISER' && (
                <>
                  <a href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">Dashboard</a>
                  <a href="/events/create" className="text-gray-600 hover:text-gray-900 text-sm">Create Event</a>
                </>
              )}
              {user.role === 'ADMIN' && (
                <a href="/venues" className="text-gray-600 hover:text-gray-900 text-sm">Venues</a>
              )}
              <span className="text-gray-400 text-sm">{user.name}</span>
              <Button variant="ghost" onClick={logout} className="text-sm">Logout</Button>
            </>
          ) : (
            <>
              <a href="/login" className="text-gray-600 hover:text-gray-900 text-sm">Login</a>
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
