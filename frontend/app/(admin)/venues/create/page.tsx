'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

interface CategoryAssignment {
  startRow: number;
  endRow: number;
  category: string;
}

// Map layout shapes to allowed event types
const SHAPE_EVENT_MAPPING: Record<string, string[]> = {
  RECTANGULAR: ['MOVIE'],
  STAGE: ['THEATER', 'LIVE_EVENT', 'COMEDY'],
  CIRCULAR: ['SPORTS', 'CONCERT']
};

export default function CreateVenuePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('10');
  const [shape, setShape] = useState('RECTANGULAR');
  const [assignments, setAssignments] = useState<CategoryAssignment[]>([
    { startRow: 1, endRow: 2, category: 'VIP' },
    { startRow: 3, endRow: 5, category: 'Standard' },
  ]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supportedEventTypes, setSupportedEventTypes] = useState<string[]>([]);

  // Sync supported events when shape changes (remove unsupported ones)
  React.useEffect(() => {
    const allowed = SHAPE_EVENT_MAPPING[shape] || [];
    setSupportedEventTypes((prev) => prev.filter((t) => allowed.includes(t)));
  }, [shape]);

  const toggleEventType = (type: string) => {
    setSupportedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const updateAssignment = (index: number, field: keyof CategoryAssignment, value: string | number) => {
    const newAssignments = [...assignments];
    if (field === 'category') {
      newAssignments[index] = { ...newAssignments[index], [field]: value as string };
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
    if (supportedEventTypes.length === 0) {
      setError('Please select at least one supported event type.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await fetchApi<any>('/api/venues', {
        method: 'POST',
        body: JSON.stringify({
          name,
          address,
          supportedEventTypes,
          layout: { rows: Number(rows), columns: Number(columns), shape },
          categoryAssignments: assignments,
        }),
      });
      router.push('/dashboard');
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
    let distanceRow = row;
    if (shape === 'CIRCULAR') {
      const midPoint = Math.ceil(rowCount / 2);
      distanceRow = row <= midPoint ? row : row - midPoint;
    }
    for (const a of assignments) {
      if (distanceRow >= a.startRow && distanceRow <= a.endRow) return a.category || 'UNASSIGNED';
    }
    return 'UNASSIGNED';
  };

  const getCategoryColor = (category: string) => {
    if (category === 'UNASSIGNED') return 'bg-red-500/30';
    const uniqueCategories = Array.from(new Set(assignments.map(a => a.category).filter(Boolean)));
    const index = uniqueCategories.indexOf(category);
    const colors = ['bg-amber-500/40', 'bg-blue-500/40', 'bg-emerald-500/40', 'bg-purple-500/40', 'bg-pink-500/40'];
    return colors[index % colors.length] || 'bg-white/10';
  };

  const renderPreviewRows = (startRowIndex: number, endRowIndex: number, isTopHalf: boolean = false) => {
    const indices = Array.from({ length: endRowIndex - startRowIndex }).map((_, i) => startRowIndex + i);
    const displayIndices = isTopHalf ? [...indices].reverse() : indices;

    return displayIndices.map((r) => {
      const row = r + 1;
      const cat = getCategoryForRow(row);
      const bgColor = getCategoryColor(cat);

      return (
        <div key={row} className="flex items-center justify-center gap-2 mb-1">
          <span className="w-5 text-xs text-white/40 text-right">{String.fromCharCode(64 + row)}</span>
          <div className={`flex gap-0.5 ${isTopHalf ? 'rotate-180' : ''}`}>
            {Array.from({ length: Math.min(colCount, 50) }).map((_, c) => (
              <div key={c} className={`w-4 h-4 rounded-t ${bgColor} border border-white/20 ${isTopHalf ? 'rotate-180' : ''}`} />
            ))}
          </div>
          <span className="w-5 text-xs text-white/40 text-left">{String.fromCharCode(64 + row)}</span>
        </div>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Create Venue</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <Input label="Venue Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} />

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Layout Shape</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                className="glass-input block w-full"
              >
                <option value="RECTANGULAR" className="bg-slate-900 text-white">Rectangular (Standard)</option>
                <option value="CIRCULAR" className="bg-slate-900 text-white">Circular (Stadium/Arena)</option>
                <option value="STAGE" className="bg-slate-900 text-white">Front Stage (Semi-circle)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Supported Events</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['CONCERT', 'MOVIE', 'SPORTS', 'THEATER', 'COMEDY', 'LIVE_EVENT'].map((type) => {
                  const isAllowedByShape = (SHAPE_EVENT_MAPPING[shape] || []).includes(type);
                  return (
                    <label key={type} className={`flex items-center space-x-2 ${isAllowedByShape ? 'text-white cursor-pointer' : 'text-white/30 cursor-not-allowed'}`}>
                      <input
                        type="checkbox"
                        checked={supportedEventTypes.includes(type)}
                        onChange={() => toggleEventType(type)}
                        disabled={!isAllowedByShape}
                        className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      />
                      <span>{type.replace('_', ' ')}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-white/40 mt-1">Select which events this venue will host from the shape&apos;s supported list.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Rows" type="number" min="1" max="26" value={rows} onChange={(e) => setRows(e.target.value)} required />
              <Input label="Columns" type="number" min="1" max="50" value={columns} onChange={(e) => setColumns(e.target.value)} required />
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm text-white">Category Assignments</h3>
                <button type="button" className="text-blue-400 text-sm hover:underline" onClick={addAssignment}>+ Add</button>
              </div>

              {shape === 'CIRCULAR' && (
                <p className="text-xs text-blue-400 mb-3 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
                  For circular layouts, assignments are mirrored symmetrically from the pitch outwards (1 to {Math.ceil(Number(rows) / 2) || 1}).
                </p>
              )}

              {assignments.map((a, i) => {
                const maxRow = shape === 'CIRCULAR' ? Math.ceil(Number(rows) / 2) : Number(rows);
                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input type="number" min="1" max={maxRow} value={String(a.startRow)} onChange={(e) => updateAssignment(i, 'startRow', e.target.value)} className="w-20" />
                    <span className="text-white/40">to</span>
                    <Input type="number" min="1" max={maxRow} value={String(a.endRow)} onChange={(e) => updateAssignment(i, 'endRow', e.target.value)} className="w-20" />
                    <Input
                      label=""
                      placeholder="Category (e.g. VIP, Standard)"
                      value={a.category}
                      onChange={(e) => updateAssignment(i, 'category', e.target.value)}
                    />
                    {assignments.length > 1 && (
                      <button type="button" className="text-red-400 hover:text-red-300 text-lg" onClick={() => removeAssignment(i)}>×</button>
                    )}
                  </div>
                );
              })}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>Create Venue</Button>
          </form>
        </div>

        {/* Grid Preview */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="font-semibold text-sm text-white/60 mb-4">Layout Preview</h3>
          <div className="overflow-auto flex-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
            {rowCount > 0 && colCount > 0 && rowCount <= 26 && colCount <= 50 ? (
              <div className="w-full min-w-max">
                {shape === 'RECTANGULAR' && (
                  <>
                    <div className="w-3/4 mx-auto h-8 bg-white/10 rounded-b-[50%] border-t-4 border-white/20 text-center text-xs font-semibold text-white/40 pt-1 mb-8 shadow-inner">
                      SCREEN
                    </div>
                    {renderPreviewRows(0, Math.min(rowCount, 26))}
                  </>
                )}

                {shape === 'STAGE' && (
                  <>
                    <div className="w-3/4 mx-auto h-12 bg-white/[0.08] rounded-b-full border-t-8 border-white/10 text-center flex items-center justify-center text-white/60 text-sm font-bold tracking-widest mb-10 shadow-2xl">
                      STAGE
                    </div>
                    {renderPreviewRows(0, Math.min(rowCount, 26))}
                  </>
                )}

                {shape === 'CIRCULAR' && (
                  <>
                    {renderPreviewRows(0, Math.ceil(Math.min(rowCount, 26) / 2), true)}
                    <div className="w-full max-w-sm mx-auto h-24 bg-green-500/[0.05] border-4 border-green-500/20 rounded-[100px] my-6 flex items-center justify-center text-green-400/60 font-bold uppercase tracking-widest shadow-inner text-xs">
                      Pitch / Court
                    </div>
                    {renderPreviewRows(Math.ceil(Math.min(rowCount, 26) / 2), Math.min(rowCount, 26), false)}
                  </>
                )}

                <div className="flex justify-center gap-6 mt-8 pt-4 border-t border-white/[0.06] text-xs text-white/60 flex-wrap">
                  {Array.from(new Set(assignments.map(a => a.category || 'UNASSIGNED'))).map((cat, idx) => (
                    <div key={cat} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border border-white/20 ${cat === 'UNASSIGNED' ? 'bg-red-500/30' : ['bg-amber-500/40', 'bg-blue-500/40', 'bg-emerald-500/40', 'bg-purple-500/40', 'bg-pink-500/40'][idx % 5]}`} />
                      {cat}
                    </div>
                  ))}
                  {!Array.from(new Set(assignments.map(a => a.category))).includes('UNASSIGNED') && (
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/30 rounded border border-white/20" /> Unassigned</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40 text-sm">
                Set rows and columns to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
