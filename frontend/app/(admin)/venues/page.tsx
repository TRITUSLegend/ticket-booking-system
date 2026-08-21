'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchApi<{ data: any[] }>('/api/venues');
        setVenues(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <div className="p-8 text-center">Loading venues...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Venues</h1>
        <Button onClick={() => window.location.href = '/venues/create'}>+ Create Venue</Button>
      </div>

      {venues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No venues created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-2">{venue.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{venue.address}</p>
              {venue.layouts?.[0] && (
                <p className="text-gray-500 text-sm">
                  Layout: {venue.layouts[0].rows} rows × {venue.layouts[0].columns} columns
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
