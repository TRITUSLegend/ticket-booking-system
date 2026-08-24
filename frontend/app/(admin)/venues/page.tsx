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

  if (isLoading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading venues...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="micro-label mb-1">Admin</p>
          <h1 className="text-3xl font-bold tracking-[-0.5px] text-[var(--text-primary)]">Venues</h1>
        </div>
        <Button onClick={() => window.location.href = '/venues/create'}>+ Create Venue</Button>
      </div>

      {venues.length === 0 ? (
        <div className="glass-card glass-card-static p-12 text-center">
          <p className="text-[var(--text-muted)]">No venues created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{venue.name}</h2>
                  <button
                    onClick={() => window.location.href = `/venues/${venue.id}/edit`}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Edit Categories
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-4">{venue.address}</p>
              {venue.layouts?.[0] && (
                <div className="text-sm text-[var(--text-muted)] space-y-1">
                  <p>
                    Layout: {venue.layouts[0].rows} rows × {venue.layouts[0].columns} columns
                    {venue.layouts[0].shape && ` (${venue.layouts[0].shape})`}
                  </p>
                  {venue.supportedEventTypes && venue.supportedEventTypes.length > 0 && (
                    <p>
                      Supported Events: {venue.supportedEventTypes.join(', ')}
                    </p>
                  )}
                </div>
              )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
