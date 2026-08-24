import React from 'react';

const LEGEND_ITEMS: { label: string; className: string; glow?: string }[] = [
  { label: 'Available', className: 'bg-[var(--color-available)] border border-white/10' },
  { label: 'Selected', className: 'bg-[var(--color-selected)]', glow: '0 0 6px var(--glow-blue)' },
  { label: 'Held', className: 'bg-[var(--color-held)]', glow: '0 0 6px var(--glow-amber)' },
  { label: 'Offered', className: 'bg-[var(--color-offered)]', glow: '0 0 6px var(--glow-purple)' },
  { label: 'Booked', className: 'bg-[var(--color-booked)] opacity-70' },
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${item.className}`}
            style={item.glow ? { boxShadow: item.glow } : undefined}
          />
          <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
