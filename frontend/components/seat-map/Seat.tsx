'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OFFERED';

interface SeatProps {
  id: string;
  label: string;
  status: SeatStatus;
  category: string;
  isMine: boolean;
  onSelect: (id: string) => void;
  /** Optional — ticket price for this seat's category, shown in the tooltip. */
  price?: number;
  /** Optional — ISO timestamp the current hold/offer lapses at, shown in the tooltip. */
  holdExpiresAt?: string | null;
}

function formatRemaining(expiresAt: string, now: number): string | null {
  const msLeft = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(msLeft) || msLeft <= 0) return null;
  const totalSeconds = Math.floor(msLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function Seat({
  id,
  label,
  status,
  category,
  isMine,
  onSelect,
  price,
  holdExpiresAt,
}: SeatProps) {
  const [ripples, setRipples] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rippleSeq = useRef(0);

  const isLocked = !isMine && (status === 'HELD' || status === 'OFFERED' || status === 'BOOKED');
  const isInteractive = status === 'AVAILABLE' || isMine;

  // Only the hovered seat ticks, so the countdown in the tooltip stays live
  // without running an interval per seat across the whole grid.
  useEffect(() => {
    if (!isHovered || !holdExpiresAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isHovered, holdExpiresAt]);

  const handleClick = useCallback(() => {
    if (!isInteractive) return;
    const rippleId = ++rippleSeq.current;
    setRipples((prev) => [...prev, rippleId]);
    onSelect(id);
  }, [isInteractive, onSelect, id]);

  const removeRipple = useCallback((rippleId: number) => {
    setRipples((prev) => prev.filter((r) => r !== rippleId));
  }, []);

  let stateClass = 'seat-available';
  let statusText = 'Available';

  if (isMine) {
    stateClass = 'seat-selected';
    statusText = 'Selected';
  } else if (status === 'BOOKED') {
    stateClass = 'seat-booked';
    statusText = 'Booked';
  } else if (status === 'OFFERED') {
    stateClass = 'seat-offered';
    statusText = 'Offered';
  } else if (status === 'HELD') {
    stateClass = 'seat-held';
    statusText = 'Held';
  }

  const remaining = holdExpiresAt && isLocked ? formatRemaining(holdExpiresAt, now) : null;
  if (remaining) statusText = `${statusText} (${remaining} left)`;

  const showPrice = typeof price === 'number' && !Number.isNaN(price) && !isLocked;
  const tooltip = [label, category, statusText, showPrice ? `₹${price}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      aria-label={tooltip}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`seat ${stateClass} w-7 h-7 rounded-seat flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`}
    >
      {ripples.map((rippleId) => (
        <span
          key={rippleId}
          className="seat-ripple"
          onAnimationEnd={() => removeRipple(rippleId)}
        />
      ))}
      <span className="seat-tooltip">{tooltip}</span>
    </div>
  );
}
