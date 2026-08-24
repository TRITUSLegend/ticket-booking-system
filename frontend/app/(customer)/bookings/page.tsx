'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';

interface BookingData {
  id: string;
  status: string;
  totalAmount: string;
  qrReference: string;
  createdAt: string;
  show: {
    date: string;
    time: string;
    event: { title: string };
    venue: { name: string };
  };
  bookingSeats: {
    showSeat: {
      seat: { label: string };
    };
  }[];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const res = await fetchApi<{ data: BookingData[] }>('/api/bookings/history');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await fetchApi<any>(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      await loadBookings();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      alert(message);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <p className="micro-label mb-2">Your tickets</p>
      <h1 className="text-3xl font-bold tracking-[-0.5px] mb-8 text-[var(--text-primary)]">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="glass-card glass-card-static p-12 text-center">
          <p className="text-[var(--text-muted)] mb-4">You haven&apos;t made any bookings yet.</p>
          <Button onClick={() => window.location.href = '/events'}>Browse Events</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const showDate = new Date(booking.show.date);
            const isPast = showDate < new Date();
            const isCancelled = booking.status === 'CANCELLED';
            const seatLabels = booking.bookingSeats.map(bs => bs.showSeat.seat.label).join(', ');

            return (
              <div
                key={booking.id}
                className={`glass-card p-6 border-l-2 transition-opacity ${
                  isCancelled
                    ? 'border-l-white/10 opacity-50'
                    : 'border-l-[var(--accent-primary)]'
                }`}
                style={isCancelled ? undefined : { boxShadow: 'inset 2px 0 12px -6px var(--glow-blue)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{booking.show.event.title}</h2>
                      <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-widest rounded-full ${
                        isCancelled
                          ? 'bg-[var(--color-booked)]/15 text-red-300'
                          : 'bg-[var(--color-success)]/15 text-emerald-300'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {showDate.toLocaleDateString()} at {booking.show.time} • {booking.show.venue.name}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Seats: {seatLabels}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Total: <span className="font-semibold text-[var(--color-success)]">₹{booking.totalAmount}</span>
                    </p>
                    <p className="text-xs font-mono mt-1 text-[var(--text-muted)]">Ref: {booking.qrReference}</p>
                  </div>

                  {!isCancelled && !isPast && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancel(booking.id)}
                      isLoading={cancellingId === booking.id}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
