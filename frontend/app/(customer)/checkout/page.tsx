'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const showId = searchParams.get('showId');
  const seatsParam = searchParams.get('seatIds');
  const seatIds = useMemo(() => (seatsParam ? seatsParam.split(',') : []), [seatsParam]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    if (!showId || seatIds.length === 0) {
      router.push('/events');
    }
  }, [showId, seatIds, router]);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetchApi<any>('/api/bookings/checkout', {
        method: 'POST',
        body: JSON.stringify({ showId, seatIds }),
      });
      setBookingData(res.data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success && bookingData) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 text-center">
        <div className="glass-card glass-card-static p-8 animate-float-in">
          <div
            className="w-16 h-16 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 24px var(--glow-green)' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="micro-label mb-2">Confirmed</p>
          <h1 className="text-3xl font-bold tracking-[-0.5px] text-[var(--color-success)] mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-8">
            Your tickets have been booked successfully. A confirmation email with your QR code has been sent.
          </p>

          {/* The QR image itself is generated and emailed by the backend; this is
              the reference it encodes, for gate checks and support lookups. */}
          <div className="glass-card glass-card-static p-6 mb-8 inline-block text-left border-[var(--color-success)]/25">
            <p className="micro-label mb-2">Booking Reference</p>
            <p className="font-mono font-semibold text-xl tracking-tight text-[var(--text-primary)]">
              {bookingData.qrReference}
            </p>
          </div>

          <div>
            <Button onClick={() => router.push('/bookings')}>View My Bookings</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="glass-card glass-card-static p-8">
        <p className="micro-label mb-2">Checkout</p>
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Complete Checkout</h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-8">
          You are about to book {seatIds.length} seat(s).
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-300 border border-red-500/20 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <Button
          className="w-full h-12 text-base"
          onClick={handleCheckout}
          isLoading={isLoading}
        >
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[var(--text-secondary)]">Loading checkout...</div>}>
      <CheckoutContent />
    </React.Suspense>
  );
}
