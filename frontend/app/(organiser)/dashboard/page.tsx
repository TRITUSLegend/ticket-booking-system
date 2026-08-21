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

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalBooked = events.reduce((sum, e) => sum + e.totalBooked, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Organiser Dashboard</h1>
        <Button onClick={() => window.location.href = '/events/create'}>+ Create Event</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-3xl font-bold">{events.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Tickets Sold</p>
          <p className="text-3xl font-bold">{totalBooked}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Events Breakdown */}
      <h2 className="text-xl font-bold mb-4">Events</h2>
      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No events created yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{event.title}</h3>
                  <span className="text-sm text-gray-500">{event.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₹{event.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{event.totalBooked} tickets</p>
                </div>
              </div>

              {event.shows.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Venue</th>
                        <th className="pb-2 text-right">Booked</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.shows.map((show) => (
                        <tr key={show.id} className="border-t border-gray-50">
                          <td className="py-2">{new Date(show.date).toLocaleDateString()} {show.time}</td>
                          <td className="py-2">{show.venue}</td>
                          <td className="py-2 text-right">{show.bookedSeats}</td>
                          <td className="py-2 text-right font-medium">₹{show.revenue.toLocaleString()}</td>
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
