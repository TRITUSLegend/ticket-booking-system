'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../../../../../lib/api-client';
import { useAuth } from '../../../../../../../lib/auth-context';
import { Button } from '../../../../../../../components/ui/Button';

/**
 * Waitlist Offer Claim Page
 * Reached via the signed link in the waitlist offer email.
 * Verifies the token with the backend, converts the OFFERED seat to HELD,
 * then redirects the user to the standard checkout flow.
 */
function OfferContent() {
  const { showId } = useParams() as { showId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [seatInfo, setSeatInfo] = useState<{ seatId: string; showId: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No offer token provided. Please use the link from your email.');
      return;
    }

    if (!user) {
      // User needs to be logged in to claim an offer
      setStatus('ready');
      return;
    }

    setStatus('ready');
  }, [token, user]);

  const handleClaim = async () => {
    if (!user) {
      // Redirect to login with a return URL
      router.push(`/login?redirect=/events/x/shows/${showId}/offer?token=${token}`);
      return;
    }

    setStatus('loading');
    try {
      const res = await fetchApi<any>('/api/waitlist/offer/complete', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setSeatInfo(res.data);
      setStatus('success');

      // Redirect to checkout with the offered seat
      setTimeout(() => {
        router.push(`/checkout?showId=${res.data.showId}&seatIds=${res.data.seatId}`);
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to claim offer';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4" />
        <p className="text-sm text-[var(--text-secondary)]">Processing your offer...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto p-8">
        <div className="glass-card glass-card-static p-8 text-center animate-float-in">
          <div
            className="w-16 h-16 bg-[var(--color-booked)]/20 text-red-300 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 20px var(--glow-red)' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">Offer Unavailable</h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-6">{errorMessage}</p>
          <Button onClick={() => router.push('/events')}>Browse Events</Button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto p-8">
        <div className="glass-card glass-card-static p-8 text-center animate-float-in">
          <div
            className="w-16 h-16 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 24px var(--glow-green)' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-success)] mb-2">Offer Claimed!</h1>
          <p className="text-sm text-[var(--text-secondary)]">Redirecting you to checkout...</p>
        </div>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="glass-card glass-card-static p-8 text-center animate-float-in border-[var(--color-offered)]/30">
        <div className="w-16 h-16 bg-[var(--color-offered)]/20 text-violet-300 rounded-full flex items-center justify-center mx-auto mb-6 animate-urgency-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <p className="micro-label mb-2">Waitlist Offer</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">You Have a Waitlist Offer!</h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-8">
          A seat has become available for you. Click below to claim it and proceed to checkout.
          This offer is time-limited — act fast!
        </p>

        {!user ? (
          <>
            <p className="text-sm text-amber-300 mb-4">You need to be logged in to claim this offer.</p>
            <Button onClick={() => router.push(`/login?redirect=/events/x/shows/${showId}/offer?token=${token}`)}>
              Log In to Claim
            </Button>
          </>
        ) : (
          <Button className="w-full h-12 text-base" onClick={handleClaim}>
            Claim My Seat
          </Button>
        )}
      </div>
    </div>
  );
}

export default function WaitlistOfferPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-secondary)]">Loading offer...</div>}>
      <OfferContent />
    </Suspense>
  );
}
