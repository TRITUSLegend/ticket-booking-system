'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../../../../lib/api-client';
import { useAuth } from '../../../../../../lib/auth-context';
import { Button } from '../../../../../../components/ui/Button';
import { SeatGrid } from '../../../../../../components/seat-map/SeatGrid';
import { SeatLegend } from '../../../../../../components/seat-map/SeatLegend';
import { useToast } from '../../../../../../components/ui/Toast';
import { Modal } from '../../../../../../components/ui/Modal';
import { SeatData } from '../../../../../../types';

export default function ShowSeatMapPage() {
  const { showId } = useParams() as { showId: string };
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showData, setShowData] = useState<any>(null);
  const [initialSeats, setInitialSeats] = useState<SeatData[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState('STANDARD');

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const [showRes, seatsRes] = await Promise.all([
          fetchApi<any>(`/api/shows/${showId}`, { requireAuth: false }),
          fetchApi<any>(`/api/seats/${showId}`, { requireAuth: false })
        ]);
        
        setShowData(showRes.data);
        setInitialSeats(seatsRes.data);
        if (showRes.data?.pricing?.[0]) {
          setWaitlistCategory(showRes.data.pricing[0].category);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load seat map', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    if (showId) load();
  }, [showId, showToast]);

  const handleHoldSeats = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${showData?.eventId}/shows/${showId}`);
      return;
    }

    if (selectedSeatIds.length === 0) return;

    setIsHolding(true);
    try {
      await fetchApi<any>('/api/seats/hold', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          seatIds: selectedSeatIds
        })
      });

      // Redirect to checkout with selected seat IDs in query
      const idsParam = selectedSeatIds.join(',');
      router.push(`/checkout?showId=${showId}&seatIds=${idsParam}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to hold seats. They may have been taken.', 'error');
      // Force refresh on failure
      window.location.reload();
    } finally {
      setIsHolding(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${showData?.eventId}/shows/${showId}`);
      return;
    }

    try {
      await fetchApi<any>('/api/waitlist/join', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          category: waitlistCategory
        })
      });
      showToast('Successfully joined waitlist', 'success');
      setIsWaitlistModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to join waitlist', 'error');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading seat map...</div>;
  if (!showData) return <div className="p-8 text-center text-red-600">Show not found</div>;

  // Calculate pricing info
  const selectedSeatsList = initialSeats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsList.reduce((sum, seat) => {
    const pricing = showData.pricing.find((p: any) => p.category === seat.category);
    return sum + Number(pricing?.price || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Seat Map */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-6 text-center">Screen / Stage</h2>
          <div className="w-full h-2 bg-gray-300 rounded-full mb-12 mx-auto max-w-2xl opacity-50" />
          
          <div className="flex justify-center min-w-max">
            <SeatGrid 
              showId={showId}
              initialSeats={initialSeats}
              onSelectionChange={setSelectedSeatIds}
            />
          </div>
        </div>

        {/* Right Column: Details & Checkout */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-2">{showData.event.title}</h3>
            <p className="text-gray-600 mb-4">
              {new Date(showData.date).toLocaleDateString()} at {showData.time}
            </p>
            <p className="text-sm text-gray-500 mb-6">{showData.venue.name}</p>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <h4 className="text-sm font-semibold mb-3">Pricing</h4>
              {showData.pricing.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm mb-1">
                  <span>{p.category}</span>
                  <span className="font-medium">₹{Number(p.price)}</span>
                </div>
              ))}
            </div>

            <SeatLegend />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h3 className="font-bold mb-4">Your Selection</h3>
            
            {selectedSeatsList.length === 0 ? (
              <p className="text-gray-500 text-sm">No seats selected</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSeatsList.map(seat => (
                    <span key={seat.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {seat.label} ({seat.category})
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between font-bold text-lg mb-6 border-t pt-4">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>

                <Button 
                  className="w-full mb-2" 
                  onClick={handleHoldSeats}
                  isLoading={isHolding}
                >
                  Book Tickets
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Seats will be held for 10 minutes to complete checkout.
                </p>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3 text-center">Show full? Join the waitlist.</p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setIsWaitlistModalOpen(true)}
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isWaitlistModalOpen} 
        onClose={() => setIsWaitlistModalOpen(false)}
        title="Join Waitlist"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            If tickets become available due to cancellations, waitlisted customers are automatically offered the tickets in order.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seat Category</label>
            <select 
              className="w-full rounded-md border border-gray-300 p-2"
              value={waitlistCategory}
              onChange={(e) => setWaitlistCategory(e.target.value)}
            >
              {showData?.pricing?.map((p: any) => (
                <option key={p.id} value={p.category}>{p.category} - ₹{Number(p.price)}</option>
              ))}
            </select>
          </div>

          <Button className="w-full mt-4" onClick={handleJoinWaitlist}>Confirm Waitlist</Button>
        </div>
      </Modal>
    </div>
  );
}
