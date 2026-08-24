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

/**
 * Mirrors the backend SEAT_HOLD_TTL_SECONDS default. Used only to scale the
 * hold-countdown bar and the copy beneath the checkout button, so the two
 * cannot drift apart.
 */
const HOLD_TTL_SECONDS = 600;

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

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

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

  // Seats this user is already holding, and when the earliest hold lapses.
  const activeHold = useMemo(() => {
    if (!user) return null;
    const mine = initialSeats.filter(
      (s) => s.status === 'HELD' && s.heldById === user.id && s.holdExpiresAt
    );
    if (mine.length === 0) return null;

    const expiresAt = Math.min(
      ...mine.map((s) => new Date(s.holdExpiresAt as string).getTime())
    );
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

    return { seatIds: mine.map((s) => s.id), expiresAt };
  }, [initialSeats, user]);

  // Drive the hold countdown once per second while a hold is live.
  useEffect(() => {
    if (!activeHold) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round((activeHold.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      return remaining;
    };

    if (tick() === 0) return;
    const timer = setInterval(() => {
      if (tick() === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeHold]);

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

  const handleResumeHold = () => {
    if (!activeHold) return;
    router.push(`/checkout?showId=${showId}&seatIds=${activeHold.seatIds.join(',')}`);
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

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Loading seat map...</div>;
  }
  if (!showData) return <div className="p-8 text-center text-red-400">Show not found</div>;

  // Calculate pricing info
  const selectedSeatsList = initialSeats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsList.reduce((sum, seat) => {
    const pricing = showData.pricing.find((p: any) => p.category === seat.category);
    return sum + Number(pricing?.price || 0);
  }, 0);

  const holdIsLive = secondsLeft !== null && secondsLeft > 0;
  const isBarVisible = selectedSeatIds.length > 0 || holdIsLive;
  const timerPercent = holdIsLive
    ? Math.max(0, Math.min(100, ((secondsLeft as number) / HOLD_TTL_SECONDS) * 100))
    : 0;
  const holdClock = holdIsLive
    ? `${Math.floor((secondsLeft as number) / 60)}:${String((secondsLeft as number) % 60).padStart(2, '0')}`
    : null;

  return (
    <div className="bg-[var(--bg-primary)] min-h-full">
      {/* pb leaves room for the sticky checkout bar */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left Column: Seat Map */}
          <div className="flex-1 bg-transparent p-4 overflow-x-auto">
            <div className="flex justify-center min-w-max">
              <SeatGrid
                showId={showId}
                initialSeats={initialSeats}
                shape={showData.layout.shape}
                onSelectionChange={setSelectedSeatIds}
                pricing={showData.pricing}
              />
            </div>
          </div>

          {/* Right Column: Details & Checkout */}
          <div className="w-full md:w-80 flex flex-col gap-6">
            <div className="glass-card glass-card-static p-6">
              <p className="micro-label mb-2">{showData.venue.name}</p>
              <h3 className="font-semibold text-lg tracking-tight mb-1">{showData.event.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {new Date(showData.date).toLocaleDateString()} at {showData.time}
              </p>

              <div className="border-t border-white/[0.06] pt-4 mb-6">
                <h4 className="micro-label mb-3">Pricing</h4>
                {showData.pricing.map((p: any) => (
                  <div key={p.id} className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--text-secondary)]">{p.category}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">₹{Number(p.price)}</span>
                  </div>
                ))}
              </div>

              <SeatLegend />
            </div>

            <div className="glass-card glass-card-static p-6 sticky top-20">
              <h3 className="micro-label mb-4">Your Selection</h3>

              {selectedSeatsList.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No seats selected</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSeatsList.map(seat => (
                      <span key={seat.id} className="bg-[var(--accent-primary)]/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                        {seat.label} ({seat.category})
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-baseline text-lg mb-6 border-t border-white/[0.06] pt-4">
                    <span className="text-sm text-[var(--text-secondary)]">Total</span>
                    <span
                      key={totalPrice}
                      className="font-semibold text-[var(--text-primary)] animate-price-pulse"
                    >
                      ₹{totalPrice}
                    </span>
                  </div>

                  <Button
                    className="w-full mb-2"
                    onClick={handleHoldSeats}
                    isLoading={isHolding}
                  >
                    Book Tickets
                  </Button>
                  <p className="text-xs text-[var(--text-muted)] text-center">
                    Seats will be held for {Math.round(HOLD_TTL_SECONDS / 60)} minutes to complete checkout.
                  </p>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <p className="text-sm text-[var(--text-muted)] mb-3 text-center">Show full? Join the waitlist.</p>
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
      </div>

      {/* Sticky checkout bar — slides up once a seat is selected or a hold is live */}
      <div
        className={`checkout-bar fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] ${
          isBarVisible ? 'visible' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            {holdIsLive && selectedSeatIds.length === 0 ? (
              <>
                <p className="micro-label mb-0.5">Hold expires in {holdClock}</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {activeHold?.seatIds.length} seat{activeHold?.seatIds.length === 1 ? '' : 's'} held
                </p>
              </>
            ) : (
              <>
                <p className="micro-label mb-0.5">
                  {selectedSeatIds.length} seat{selectedSeatIds.length === 1 ? '' : 's'} selected
                  {holdClock ? ` · hold expires in ${holdClock}` : ''}
                </p>
                <p
                  key={totalPrice}
                  className="text-lg font-semibold text-[var(--text-primary)] animate-price-pulse"
                >
                  ₹{totalPrice}
                </p>
              </>
            )}
          </div>

          {holdIsLive && selectedSeatIds.length === 0 ? (
            <Button onClick={handleResumeHold}>Resume checkout</Button>
          ) : (
            <Button onClick={handleHoldSeats} isLoading={isHolding}>
              Proceed to checkout
            </Button>
          )}
        </div>

        {/* Hold TTL depletion bar */}
        {holdIsLive && (
          <div className="w-full bg-white/[0.06]">
            <div
              className="timer-bar"
              style={{ width: `${timerPercent}%` }}
              role="progressbar"
              aria-label="Time remaining on your seat hold"
              aria-valuenow={secondsLeft ?? 0}
              aria-valuemin={0}
              aria-valuemax={HOLD_TTL_SECONDS}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        title="Join Waitlist"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            If tickets become available due to cancellations, waitlisted customers are automatically offered the tickets in order.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Seat Category</label>
            <select
              className="glass-select w-full [&>option]:bg-slate-900 [&>option]:text-white"
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
