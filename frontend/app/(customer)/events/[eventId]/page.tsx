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

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Loading event details...</div>;
  }
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

  const showCount = event.shows.length;
  const nextShow = showCount > 0 ? event.shows[0] : null;

  return (
    <div>
      {/* Hero — drifting gradient with ambient glow orbs behind a frosted info bar */}
      <section className="hero-gradient">
        <div
          className="hero-orb"
          style={{ width: 120, height: 120, top: '-30px', right: '10%', background: 'rgba(59, 130, 246, 0.2)' }}
        />
        <div
          className="hero-orb"
          style={{ width: 80, height: 80, bottom: '-20px', left: '12%', background: 'rgba(139, 92, 246, 0.15)', animationDelay: '2s' }}
        />

        <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <p className="micro-label mb-3">{event.type.replace('_', ' ')}</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">
            {event.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] max-w-2xl">
            {event.description}
          </p>

          {/* Frosted info bar, floats in on load */}
          <div className="glass-card glass-card-static info-float mt-8 p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div>
              <p className="micro-label mb-1">Organiser</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{event.organiser.name}</p>
            </div>
            <div>
              <p className="micro-label mb-1">Shows</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {showCount} scheduled
              </p>
            </div>
            {nextShow && (
              <div>
                <p className="micro-label mb-1">Next Show</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {new Date(nextShow.date).toLocaleDateString()} · {nextShow.time}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Available Shows</h2>

        <div className="space-y-4">
          {event.shows.map((show: any, index: number) => (
            <div
              key={show.id}
              className={`glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                index === 0 ? 'border-[var(--accent-primary)]/40 shadow-glow-blue' : ''
              }`}
            >
              <div>
                {index === 0 && <p className="micro-label mb-1">Next Up</p>}
                <h3 className="font-semibold text-lg tracking-tight text-[var(--text-primary)]">
                  {new Date(show.date).toLocaleDateString()} at {show.time}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {show.venue.name}, {show.venue.address}
                </p>
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
            <div className="glass-card glass-card-static p-12 text-center text-[var(--text-muted)]">
              No shows scheduled for this event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
