'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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

  // Derived from the already-fetched list — no extra API calls.
  const availableTypes = useMemo(
    () => Array.from(new Set(events.map((e) => e.type))).sort(),
    [events]
  );

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = typeFilter === 'ALL' || event.type === typeFilter;
      const matchesSearch =
        !query ||
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [events, search, typeFilter]);

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Loading events...</div>;
  }

  return (
    <div>
      {/* Hero — drifting gradient with ambient glow orbs */}
      <section className="hero-gradient">
        <div
          className="hero-orb"
          style={{ width: 120, height: 120, top: '-20px', right: '8%', background: 'rgba(59, 130, 246, 0.2)' }}
        />
        <div
          className="hero-orb"
          style={{ width: 80, height: 80, bottom: '-10px', left: '10%', background: 'rgba(139, 92, 246, 0.15)', animationDelay: '2s' }}
        />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <p className="micro-label mb-3">Now Booking</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">
            Upcoming Events
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] max-w-lg">
            Pick a show, choose your seats on a live seat map, and check out in seconds.
          </p>

          {/* Frosted filter bar, floats in on load */}
          <div className="glass-card glass-card-static info-float mt-8 p-4 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              aria-label="Search events"
              className="glass-input flex-1"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by event type"
              className="glass-select sm:w-48 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="ALL">All types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {String(type).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-baseline justify-between mb-6">
          <p className="micro-label">
            {visibleEvents.length} {visibleEvents.length === 1 ? 'Event' : 'Events'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event) => {
            const showCount = event._count?.shows ?? 0;
            return (
              <div key={event.id} className="glass-card p-6 flex flex-col">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {event.title}
                  </h2>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-widest text-white/70">
                    {event.type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-6 flex-grow">
                  {event.description}
                </p>

                <div className="flex items-center gap-2 mb-5">
                  <span
                    className={`w-2 h-2 rounded-full ${showCount > 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-booked)]'}`}
                    style={{
                      boxShadow: showCount > 0
                        ? '0 0 8px var(--glow-green)'
                        : '0 0 8px var(--glow-red)',
                    }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">
                    {showCount > 0
                      ? `${showCount} show${showCount === 1 ? '' : 's'} available`
                      : 'No shows scheduled'}
                  </span>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => window.location.href = `/events/${event.id}`}
                >
                  View Shows
                </Button>
              </div>
            );
          })}

          {visibleEvents.length === 0 && (
            <div className="col-span-full glass-card glass-card-static p-12 text-center text-[var(--text-muted)]">
              {events.length === 0 ? 'No events found.' : 'No events match your filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
