'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetchApi<any>('/api/events', { requireAuth: false });
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  if (isLoading) return <div className="p-8 text-center">Loading events...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{event.title}</h2>
              <span className="px-2 py-1 bg-gray-100 text-xs font-semibold rounded text-gray-600">
                {event.type}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-grow">{event.description}</p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => window.location.href = `/events/${event.id}`}
            >
              View Shows
            </Button>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No events found.
          </div>
        )}
      </div>
    </div>
  );
}
