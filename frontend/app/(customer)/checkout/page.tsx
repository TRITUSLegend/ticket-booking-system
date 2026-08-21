'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const showId = searchParams.get('showId');
  const seatsParam = searchParams.get('seats');
  const seatIds = seatsParam ? seatsParam.split(',') : [];

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-8">
            Your tickets have been booked successfully. A confirmation email with your QR code has been sent.
          </p>
          <div className="bg-gray-50 p-4 rounded-md mb-8 inline-block text-left">
            <p className="text-sm text-gray-500 mb-1">Booking Reference ID</p>
            <p className="font-mono font-bold text-lg">{bookingData.qrReference}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Complete Checkout</h1>
        <p className="text-gray-600 mb-8">
          You are about to book {seatIds.length} seat(s).
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <Button 
          className="w-full h-12 text-lg" 
          onClick={handleCheckout}
          isLoading={isLoading}
        >
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() { return <React.Suspense fallback={<div>Loading checkout...</div>}><CheckoutContent /></React.Suspense>; }
