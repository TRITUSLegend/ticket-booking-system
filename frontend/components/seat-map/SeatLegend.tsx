import React from 'react';

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center text-sm">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-white/[0.06] rounded-sm mr-2"></div>
        <span className="text-white/35">Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-[#3B82F6] rounded-sm mr-2"></div>
        <span className="text-white/35">Selected</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-2"></div>
        <span className="text-white/35">Held</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-[#EF4444] opacity-70 rounded-sm mr-2"></div>
        <span className="text-white/35">Booked</span>
      </div>
    </div>
  );
}
