'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../lib/auth-context';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetchApi<any>(`/api/events/${eventId}`, { requireAuth: false });
        setEvent(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  if (isLoading) return <div className="p-8 text-center">Loading event details...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <span className="px-3 py-1 bg-gray-100 text-sm font-semibold rounded-full text-gray-600">
            {event.type}
          </span>
        </div>
        <p className="text-gray-700 mb-4">{event.description}</p>
        <p className="text-sm text-gray-500">Organized by {event.organiser.name}</p>
      </div>

      <h2 className="text-2xl font-bold mb-6">Available Shows</h2>
      <div className="space-y-4">
        {event.shows.map((show: any) => (
          <div key={show.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">{new Date(show.date).toLocaleDateString()} at {show.time}</h3>
              <p className="text-gray-600">{show.venue.name}, {show.venue.address}</p>
            </div>
            {(!user || user.role === 'CUSTOMER') && (
              <Button
                onClick={() => window.location.href = `/events/${event.id}/shows/${show.id}`}
              >
                Select Seats
              </Button>
            )}
          </div>
        ))}
        {event.shows.length === 0 && (
          <p className="text-gray-500">No shows scheduled for this event yet.</p>
        )}
      </div>
    </div>
  );
}
