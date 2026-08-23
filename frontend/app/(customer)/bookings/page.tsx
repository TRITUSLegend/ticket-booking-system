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

  if (isLoading) return <div className="p-8 text-center">Loading bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 mb-4">You haven&apos;t made any bookings yet.</p>
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
              <div key={booking.id} className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-white">{booking.show.event.title}</h2>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-white/55 text-sm">
                      {showDate.toLocaleDateString()} at {booking.show.time} • {booking.show.venue.name}
                    </p>
                    <p className="text-white/40 text-sm mt-1">Seats: {seatLabels}</p>
                    <p className="text-white/40 text-sm">Total: <span className="text-green-400">₹{booking.totalAmount}</span></p>
                    <p className="text-white/30 text-xs font-mono mt-1">Ref: {booking.qrReference}</p>
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
