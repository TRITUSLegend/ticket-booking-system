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
  const [venueCategories, setVenueCategories] = useState<string[]>([]);
  const [pricingInputs, setPricingInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventCreated) {
      fetchApi<{ data: { id: string; name: string }[] }>(`/api/venues?eventType=${type}`)
        .then((res) => setVenues(res.data))
        .catch(console.error);
    }
  }, [eventCreated, type]);

  useEffect(() => {
    if (venueId) {
      fetchApi<{ data: any }>(`/api/venues/${venueId}`)
        .then((res) => {
          const layout = res.data.layouts?.[0];
          if (layout && layout.seats) {
            const uniqueCats = Array.from(new Set(layout.seats.map((s: any) => s.category))) as string[];
            setVenueCategories(uniqueCats);
            const defaultPricing: Record<string, string> = {};
            uniqueCats.forEach(cat => defaultPricing[cat] = '');
            setPricingInputs(defaultPricing);
          }
        })
        .catch(console.error);
    }
  }, [venueId]);

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
      const pricing = venueCategories.map(cat => ({
        category: cat,
        price: Number(pricingInputs[cat]) || 0
      }));

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
        <div className="glass-card glass-card-static p-8 animate-float-in">
          <p className="micro-label mb-2">Step 2 of 2</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">Event Created!</h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-6">Now schedule a show for this event.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateShow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Venue</label>
              <select
                className="block w-full rounded-lg bg-white/[0.05] border border-white/10 text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 sm:text-sm px-3 py-2 outline-none [&>option]:bg-slate-900 [&>option]:text-white"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                required
              >
                <option value="" disabled className="bg-slate-900 text-white/40">
                  {venues.length === 0 ? 'No compatible venues available' : 'Select a venue...'}
                </option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-white">{v.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Show Date"
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              required
              className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-lg"
            />
            <Input
              label="Show Time"
              type="time"
              value={showTime}
              onChange={(e) => setShowTime(e.target.value)}
              required
              className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-lg"
            />

            {venueCategories.length > 0 && (
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-sm font-medium text-white/60 mb-2">Set Pricing per Category</h4>
                <div className="grid grid-cols-2 gap-4">
                  {venueCategories.map(cat => (
                    <Input
                      key={cat}
                      label={`${cat} Price (₹)`}
                      type="number"
                      min="1"
                      value={pricingInputs[cat] || ''}
                      onChange={(e) => setPricingInputs({ ...pricingInputs, [cat]: e.target.value })}
                      required
                      className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>Schedule Show</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="glass-card glass-card-static p-8">
        <p className="micro-label mb-2">Step 1 of 2</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-6">Create New Event</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-lg"
          />
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Description</label>
            <textarea
              className="block w-full rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 sm:text-sm px-3 py-2 outline-none transition-all"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Event Type</label>
            <select
              className="block w-full rounded-lg bg-white/[0.05] border border-white/10 text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 sm:text-sm px-3 py-2 outline-none [&>option]:bg-slate-900 [&>option]:text-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="CONCERT" className="bg-slate-900 text-white">Concert</option>
              <option value="MOVIE" className="bg-slate-900 text-white">Movie</option>
              <option value="SPORTS" className="bg-slate-900 text-white">Sports</option>
              <option value="THEATER" className="bg-slate-900 text-white">Theater</option>
              <option value="COMEDY" className="bg-slate-900 text-white">Comedy</option>
              <option value="LIVE_EVENT" className="bg-slate-900 text-white">Live Event</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>Create Event</Button>
        </form>
      </div>
    </div>
  );
}
