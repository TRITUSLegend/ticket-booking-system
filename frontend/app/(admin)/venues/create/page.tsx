'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

interface CategoryAssignment {
  startRow: number;
  endRow: number;
  category: 'PREMIUM' | 'STANDARD';
}

export default function CreateVenuePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('10');
  const [assignments, setAssignments] = useState<CategoryAssignment[]>([
    { startRow: 1, endRow: 2, category: 'PREMIUM' },
    { startRow: 3, endRow: 5, category: 'STANDARD' },
  ]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateAssignment = (index: number, field: keyof CategoryAssignment, value: string | number) => {
    const newAssignments = [...assignments];
    if (field === 'category') {
      newAssignments[index] = { ...newAssignments[index], [field]: value as 'PREMIUM' | 'STANDARD' };
    } else {
      newAssignments[index] = { ...newAssignments[index], [field]: Number(value) };
    }
    setAssignments(newAssignments);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { startRow: 1, endRow: 1, category: 'STANDARD' }]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length <= 1) return;
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await fetchApi<any>('/api/venues', {
        method: 'POST',
        body: JSON.stringify({
          name,
          address,
          layout: { rows: Number(rows), columns: Number(columns) },
          categoryAssignments: assignments,
        }),
      });
      router.push('/venues');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create venue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Visual grid preview
  const rowCount = Number(rows) || 0;
  const colCount = Number(columns) || 0;

  const getCategoryForRow = (row: number): string => {
    for (const a of assignments) {
      if (row >= a.startRow && row <= a.endRow) return a.category;
    }
    return 'UNASSIGNED';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Create Venue</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Input label="Venue Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Rows" type="number" min="1" max="26" value={rows} onChange={(e) => setRows(e.target.value)} required />
              <Input label="Columns" type="number" min="1" max="50" value={columns} onChange={(e) => setColumns(e.target.value)} required />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Category Assignments</h3>
                <button type="button" className="text-primary text-sm hover:underline" onClick={addAssignment}>+ Add</button>
              </div>

              {assignments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Input type="number" min="1" max={rows} value={String(a.startRow)} onChange={(e) => updateAssignment(i, 'startRow', e.target.value)} className="w-20" />
                  <span className="text-gray-400">to</span>
                  <Input type="number" min="1" max={rows} value={String(a.endRow)} onChange={(e) => updateAssignment(i, 'endRow', e.target.value)} className="w-20" />
                  <select
                    className="rounded-md border border-gray-300 px-2 py-2 text-sm"
                    value={a.category}
                    onChange={(e) => updateAssignment(i, 'category', e.target.value)}
                  >
                    <option value="PREMIUM">Premium</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                  {assignments.length > 1 && (
                    <button type="button" className="text-red-400 hover:text-red-600 text-lg" onClick={() => removeAssignment(i)}>×</button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>Create Venue</Button>
          </form>
        </div>

        {/* Grid Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">Layout Preview</h3>
          <div className="overflow-auto">
            {rowCount > 0 && colCount > 0 && rowCount <= 26 && colCount <= 50 ? (
              <div className="space-y-1">
                {Array.from({ length: Math.min(rowCount, 26) }).map((_, r) => {
                  const row = r + 1;
                  const cat = getCategoryForRow(row);
                  const bgColor = cat === 'PREMIUM' ? 'bg-amber-200' : cat === 'STANDARD' ? 'bg-blue-200' : 'bg-red-200';
                  return (
                    <div key={row} className="flex items-center gap-1">
                      <span className="w-5 text-xs text-gray-400 text-right">{String.fromCharCode(64 + row)}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(colCount, 50) }).map((_, c) => (
                          <div key={c} className={`w-4 h-4 rounded-t ${bgColor} border border-gray-300`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-200 rounded border border-gray-300" /> Premium</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 rounded border border-gray-300" /> Standard</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-200 rounded border border-gray-300" /> Unassigned</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Set rows and columns to preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
