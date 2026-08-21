'use client';

import React from 'react';

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
  let bgColor = 'bg-seat-available';
  let cursor = 'cursor-pointer hover:ring-2 hover:ring-primary';
  let title = `${label} (${category}) - Available`;

  if (isMine) {
    bgColor = 'bg-seat-mine';
    title = `${label} (${category}) - Held by you`;
  } else if (status === 'BOOKED') {
    bgColor = 'bg-seat-booked';
    cursor = 'cursor-not-allowed opacity-60';
    title = `${label} - Booked`;
  } else if (status === 'HELD' || status === 'OFFERED') {
    bgColor = 'bg-seat-held';
    cursor = 'cursor-not-allowed opacity-80';
    title = `${label} - Currently unavailable`;
  }

  const handleClick = () => {
    if (status === 'AVAILABLE' || isMine) {
      onSelect(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      title={title}
      className={`w-8 h-8 rounded-t-lg border border-gray-300 flex items-center justify-center text-[10px] font-medium transition-all ${bgColor} ${cursor}`}
    >
      {label.split('-')[1]}
    </div>
  );
}
