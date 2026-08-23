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

  if (isLoading) return <div className="p-8 text-center text-white/60">Loading dashboard...</div>;

  const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalBooked = events.reduce((sum, e) => sum + e.totalBooked, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Organiser Dashboard</h1>
        <Button onClick={() => window.location.href = '/events/create'}>+ Create Event</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <p className="text-sm text-white/50">Total Events</p>
          <p className="text-3xl font-bold text-white mt-1">{events.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-white/50">Total Tickets Sold</p>
          <p className="text-3xl font-bold text-white mt-1">{totalBooked}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-white/50">Total Revenue</p>
          <p className="text-3xl font-bold text-green-400 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Events Breakdown */}
      <h2 className="text-xl font-bold text-white mb-4">Events</h2>
      {events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40">No events created yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  <span className="text-sm text-white/50">{event.type}</span>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-xl font-bold text-green-400">₹{event.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-white/50">{event.totalBooked} tickets</p>
                  <a href={`/events/${event.id}/summary`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    View Summary →
                  </a>
                </div>
              </div>

              {event.shows.length > 0 && (
                <div className="border-t border-white/[0.06] pt-4">
                  <table className="w-full text-sm">
                    <thead className="text-left text-white/40 text-xs uppercase">
                      <tr>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Venue</th>
                        <th className="pb-2 text-right">Booked</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.shows.map((show) => (
                        <tr key={show.id} className="border-t border-white/[0.06]">
                          <td className="py-2 text-white/60">{new Date(show.date).toLocaleDateString()} {show.time}</td>
                          <td className="py-2 text-white/60">{show.venue}</td>
                          <td className="py-2 text-right text-white/60">{show.bookedSeats}</td>
                          <td className="py-2 text-right font-medium text-white">₹{show.revenue.toLocaleString()}</td>
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
