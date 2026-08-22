'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '../../../../../lib/api-client';
import { useAuth } from '../../../../../lib/auth-context';

/**
 * Organiser Event Summary Page
 * Shows granular booking data for a single event — per-show breakdown,
 * individual bookings with customer names, seat labels, and revenue.
 */
export default function EventSummaryPage() {
  const { eventId } = useParams() as { eventId: string };
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ORGANISER') return;
    const load = async () => {
      try {
        const res = await fetchApi<any>(`/api/organiser/events/${eventId}/summary`);
        setEvent(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load event summary';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [eventId, user]);

  if (isLoading) return <div className="p-8 text-center">Loading event summary...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!event) return <div className="p-8 text-center text-red-600">Event not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-gray-600 mt-1">{event.description}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-sm font-semibold rounded-full text-gray-600">
          {event.type}
        </span>
      </div>

      <h2 className="text-xl font-bold mb-4">Shows</h2>

      {event.shows.length === 0 ? (
        <p className="text-gray-500">No shows scheduled for this event.</p>
      ) : (
        <div className="space-y-8">
          {event.shows.map((show: any) => {
            const totalRevenue = show.bookings.reduce(
              (sum: number, b: any) => sum + Number(b.totalAmount),
              0
            );

            return (
              <div key={show.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Show Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-lg">
                      {new Date(show.date).toLocaleDateString()} at {show.time}
                    </h3>
                    <p className="text-gray-600 text-sm">{show.venue.name} — {show.venue.address}</p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm text-gray-500">Total Seats: {show._count.seats}</p>
                    <p className="text-sm text-gray-500">Bookings: {show.bookings.length}</p>
                    <p className="text-lg font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Pricing</h4>
                  <div className="flex gap-4">
                    {show.pricing.map((p: any) => (
                      <span key={p.id} className="bg-gray-50 border border-gray-200 rounded px-3 py-1 text-sm">
                        {p.category}: ₹{Number(p.price)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bookings Table */}
                {show.bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b border-gray-100">
                        <tr>
                          <th className="pb-2 pr-4">Customer</th>
                          <th className="pb-2 pr-4">Email</th>
                          <th className="pb-2 pr-4">Seats</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {show.bookings.map((booking: any) => {
                          const seatLabels = booking.bookingSeats
                            .map((bs: any) => `${bs.showSeat.seat.label} (${bs.showSeat.seat.category})`)
                            .join(', ');

                          return (
                            <tr key={booking.id} className="border-b border-gray-50">
                              <td className="py-2 pr-4">{booking.customer.name}</td>
                              <td className="py-2 pr-4 text-gray-500">{booking.customer.email}</td>
                              <td className="py-2 pr-4">{seatLabels}</td>
                              <td className="py-2 text-right font-medium">₹{Number(booking.totalAmount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No bookings for this show yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
