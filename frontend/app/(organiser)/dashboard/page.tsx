'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';

interface ShowData {
  id: string;
  date: string;
  time: string;
  venue: string;
  bookedSeats: number;
  revenue: number;
}

interface EventData {
  id: string;
  title: string;
  type: string;
  totalRevenue: number;
  totalBooked: number;
  shows: ShowData[];
}

export default function OrganiserDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ORGANISER') return;
    const load = async () => {
      try {
        const res = await fetchApi<{ data: EventData[] }>('/api/organiser/dashboard');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (isLoading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading dashboard...</div>;

  const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalBooked = events.reduce((sum, e) => sum + e.totalBooked, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="micro-label mb-1">Organiser</p>
          <h1 className="text-3xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">Dashboard</h1>
        </div>
        <Button onClick={() => window.location.href = '/events/create'}>+ Create Event</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <p className="micro-label">Total Events</p>
          <p className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-2">{events.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="micro-label">Total Tickets Sold</p>
          <p className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-2">{totalBooked}</p>
        </div>
        <div className="glass-card p-6">
          <p className="micro-label">Total Revenue</p>
          <p className="text-3xl font-bold tracking-tight text-[var(--color-success)] mt-2">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Events Breakdown */}
      <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">Events</h2>
      {events.length === 0 ? (
        <div className="glass-card glass-card-static p-12 text-center">
          <p className="text-[var(--text-muted)]">No events created yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{event.title}</h3>
                  <span className="micro-label">{event.type}</span>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-xl font-semibold tracking-tight text-[var(--color-success)]">₹{event.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-[var(--text-muted)]">{event.totalBooked} tickets</p>
                  <a href={`/events/${event.id}/summary`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    View Summary →
                  </a>
                </div>
              </div>

              {event.shows.length > 0 && (
                <div className="border-t border-white/[0.06] pt-4">
                  <table className="w-full text-sm">
                    <thead className="text-left micro-label">
                      <tr>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Venue</th>
                        <th className="pb-2 text-right">Booked</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.shows.map((show, rowIndex) => (
                        <tr
                          key={show.id}
                          className={`border-t border-white/[0.06] ${rowIndex % 2 === 1 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                        >
                          <td className="py-2 px-2 text-[var(--text-secondary)]">{new Date(show.date).toLocaleDateString()} {show.time}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)]">{show.venue}</td>
                          <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{show.bookedSeats}</td>
                          <td className="py-2 px-2 text-right font-semibold text-[var(--text-primary)]">₹{show.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
