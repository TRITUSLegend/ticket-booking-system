'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';
import { useAuth } from '../../../../lib/auth-context';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CONCERT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // After event creation, we need venue selection for show scheduling
  const [eventCreated, setEventCreated] = useState<string | null>(null);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [venueId, setVenueId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('');
  const [standardPrice, setStandardPrice] = useState('');

  useEffect(() => {
    if (eventCreated) {
      fetchApi<{ data: { id: string; name: string }[] }>('/api/venues')
        .then((res) => setVenues(res.data))
        .catch(console.error);
    }
  }, [eventCreated]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetchApi<{ data: { id: string } }>('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, type }),
      });
      setEventCreated(res.data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const pricing = [];
      if (premiumPrice) pricing.push({ category: 'PREMIUM', price: Number(premiumPrice) });
      if (standardPrice) pricing.push({ category: 'STANDARD', price: Number(standardPrice) });

      await fetchApi<any>('/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          eventId: eventCreated,
          venueId,
          date: new Date(showDate).toISOString(),
          time: showTime,
          pricing,
        }),
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create show';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (eventCreated) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold mb-2">Event Created!</h1>
          <p className="text-gray-600 mb-6">Now schedule a show for this event.</p>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <form onSubmit={handleCreateShow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                required
              >
                <option value="">Select a venue...</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <Input label="Show Date" type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} required />
            <Input label="Show Time" type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} required />
            <Input label="Premium Price (₹)" type="number" value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} required />
            <Input label="Standard Price (₹)" type="number" value={standardPrice} onChange={(e) => setStandardPrice(e.target.value)} required />
            <Button type="submit" className="w-full" isLoading={isLoading}>Schedule Show</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input label="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="CONCERT">Concert</option>
              <option value="MOVIE">Movie</option>
            </select>
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>Create Event</Button>
        </form>
      </div>
    </div>
  );
}
