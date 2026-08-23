'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '../../../../../lib/api-client';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';

export default function EditVenueCategoriesPage() {
  const router = useRouter();
  const params = useParams();
  const venueId = params.venueId as string;

  const [venue, setVenue] = useState<any>(null);
  const [assignments, setAssignments] = useState<{ startRow: number; endRow: number; category: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVenue = async () => {
      try {
        const res = await fetchApi<{ data: any }>(`/api/venues/${venueId}`);
        setVenue(res.data);

        const shape = res.data.layouts[0].shape;
        const rows = res.data.layouts[0].rows;
        const maxRow = shape === 'CIRCULAR' ? Math.ceil(rows / 2) : rows;

        setAssignments([{ startRow: 1, endRow: maxRow, category: 'Standard' }]);
      } catch (err: any) {
        setError(err.message || 'Failed to load venue');
      } finally {
        setIsLoading(false);
      }
    };
    loadVenue();
  }, [venueId]);

  const updateAssignment = (index: number, field: string, value: string) => {
    const newAssignments = [...assignments];
    if (field === 'category') {
      newAssignments[index] = { ...newAssignments[index], [field]: value };
    } else {
      newAssignments[index] = { ...newAssignments[index], [field]: Number(value) };
    }
    setAssignments(newAssignments);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { startRow: 1, endRow: 1, category: 'Standard' }]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length <= 1) return;
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await fetchApi(`/api/venues/${venueId}/categories`, {
        method: 'PUT',
        body: JSON.stringify({ categoryAssignments: assignments }),
      });
      router.push('/venues');
    } catch (err: any) {
      setError(err.message || 'Failed to update categories');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading venue...</div>;
  if (!venue) return <div className="p-8 text-center text-red-600">Venue not found</div>;

  const layout = venue.layouts[0];
  const maxRow = layout.shape === 'CIRCULAR' ? Math.ceil(layout.rows / 2) : layout.rows;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold">Edit Seat Categories</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">{venue.name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            Shape: {layout.shape} | Rows: {layout.rows} | Columns: {layout.columns}
          </p>
          <p className="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
            Note: You are overwriting all existing seat categories for this venue. This action is only allowed if no shows have been scheduled here yet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Category Assignments</h3>
              <button type="button" className="text-primary text-sm hover:underline font-medium" onClick={addAssignment}>+ Add Row Range</button>
            </div>

            {layout.shape === 'CIRCULAR' && (
              <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                For circular layouts, assignments are mirrored symmetrically from the pitch outwards (1 to {maxRow}).
              </p>
            )}

            <div className="space-y-3">
              {assignments.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input type="number" min="1" max={maxRow} value={String(a.startRow)} onChange={(e: any) => updateAssignment(i, 'startRow', e.target.value)} className="w-24" />
                  <span className="text-gray-400">to</span>
                  <Input type="number" min="1" max={maxRow} value={String(a.endRow)} onChange={(e: any) => updateAssignment(i, 'endRow', e.target.value)} className="w-24" />
                  <Input
                    label=""
                    placeholder="Category (e.g. VIP, Standard)"
                    value={a.category}
                    onChange={(e: any) => updateAssignment(i, 'category', e.target.value)}
                  />
                  {assignments.length > 1 && (
                    <button type="button" className="text-red-400 hover:text-red-600 text-xl font-bold ml-2" onClick={() => removeAssignment(i)}>&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isSaving}>Save New Categories</Button>
        </form>
      </div>
    </div>
  );
}
