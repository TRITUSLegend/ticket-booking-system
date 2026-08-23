'use client';

import React, { useState, useEffect } from 'react';

type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OFFERED';

interface SeatProps {
  id: string;
  label: string;
  status: SeatStatus;
  category: string;
  isMine: boolean;
  onSelect: (id: string) => void;
}

export function Seat({ id, label, status, category, isMine, onSelect }: SeatProps) {
  const [showRipple, setShowRipple] = useState(false);

  let bgColor = 'bg-white/[0.06]';
  let cursor = 'cursor-pointer hover:bg-[rgba(59,130,246,0.25)] hover:scale-125 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-200';
  let title = `${label} (${category}) - Available`;

  if (isMine) {
    bgColor = 'bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-105';
    cursor = 'cursor-pointer';
    title = `${label} (${category}) - Held by you`;
  } else if (status === 'BOOKED') {
    bgColor = 'bg-[#EF4444] opacity-70';
    cursor = 'cursor-not-allowed';
    title = `${label} - Booked`;
  } else if (status === 'HELD' || status === 'OFFERED') {
    bgColor = 'bg-[#F59E0B] animate-pulse-held';
    cursor = 'cursor-not-allowed';
    title = `${label} - Currently unavailable`;
  }

  const handleClick = () => {
    if (status === 'AVAILABLE' || isMine) {
      setShowRipple(true);
      onSelect(id);
    }
  };

  useEffect(() => {
    if (showRipple) {
      const timer = setTimeout(() => setShowRipple(false), 500);
      return () => clearTimeout(timer);
    }
  }, [showRipple]);

  return (
    <div
      onClick={handleClick}
      className={`group relative w-7 h-7 rounded-[4px] flex items-center justify-center transition-all ${bgColor} ${cursor}`}
    >
      {showRipple && (
        <span 
          className="absolute inset-0 rounded-[4px] border-[1.5px] border-[#3B82F6]"
          style={{ animation: 'pulse-ring 0.5s ease-out forwards' }} 
        />
      )}
      <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.95)] backdrop-blur-lg border border-white/10 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-10">
        {title}
      </span>
    </div>
  );
}
