'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../../../lib/api-client';
import { useAuth } from '../../../../../lib/auth-context';
import { Modal } from '../../../../../components/ui/Modal';
import { Input } from '../../../../../components/ui/Input';
import { Button } from '../../../../../components/ui/Button';

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

  // Add show state
  const [isAddShowModalOpen, setIsAddShowModalOpen] = useState(false);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [venueId, setVenueId] = useState('');
  const [venueCategories, setVenueCategories] = useState<string[]>([]);
  const [pricingInputs, setPricingInputs] = useState<Record<string, string>>({});
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [isSubmittingShow, setIsSubmittingShow] = useState(false);
  const [showError, setShowError] = useState('');

  const router = useRouter();

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

  useEffect(() => {
    if (isAddShowModalOpen && event?.type) {
      fetchApi<{ data: { id: string; name: string }[] }>(`/api/venues?eventType=${event.type}`)
        .then((res) => setVenues(res.data))
        .catch(console.error);
    }
  }, [isAddShowModalOpen, event?.type]);

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

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This will cancel all bookings and refund customers. This action cannot be undone.')) {
      return;
    }

    try {
      await fetchApi(`/api/events/${eventId}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!confirm('Are you sure you want to delete this show? This will cancel all bookings for this show and refund customers. This action cannot be undone.')) {
      return;
    }

    try {
      await fetchApi(`/api/shows/${showId}`, { method: 'DELETE' });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to delete show');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading event summary...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!event) return <div className="p-8 text-center text-red-600">Event not found.</div>;

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingShow(true);
    setShowError('');
    try {
      const pricing = venueCategories.map(cat => ({
        category: cat,
        price: Number(pricingInputs[cat]) || 0
      }));

      await fetchApi('/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          venueId,
          date: new Date(showDate).toISOString(),
          time: showTime,
          pricing,
        }),
      });
      setIsAddShowModalOpen(false);
      // Reload event data to show the new show
      window.location.reload();
    } catch (err: any) {
      setShowError(err.message || 'Failed to schedule show');
    } finally {
      setIsSubmittingShow(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-gray-600 mt-1">{event.description}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-sm font-semibold rounded-full text-gray-600">
            {event.type}
          </span>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button
            onClick={() => setIsAddShowModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-blue-700 transition"
          >
            Schedule Additional Show
          </button>
          <button
            onClick={handleDeleteEvent}
            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition"
          >
            Delete Event
          </button>
        </div>
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
                  <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Seats: {show._count.seats}</p>
                      <p className="text-sm text-gray-500">Bookings: {show.bookings.length}</p>
                      <p className="text-lg font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteShow(show.id)}
                      className="text-sm text-red-600 hover:text-red-800 transition underline"
                    >
                      Delete Show
                    </button>
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

      <Modal
        isOpen={isAddShowModalOpen}
        onClose={() => setIsAddShowModalOpen(false)}
        title="Schedule Additional Show"
      >
        <form onSubmit={handleAddShow} className="space-y-4">
          {showError && <div className="text-red-500 text-sm mb-4">{showError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              required
            >
              <option value="" disabled>
                {venues.length === 0 ? 'No compatible venues available' : 'Select a venue...'}
              </option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <Input label="Show Date" type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} required />
          <Input label="Show Time" type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} required />

          {venueCategories.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Set Pricing per Category</h4>
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
                  />
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmittingShow}>Schedule Show</Button>
        </form>
      </Modal>
    </div>
  );
}
