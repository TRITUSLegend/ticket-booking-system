import React from 'react';

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center text-sm text-gray-600 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center">
        <div className="w-5 h-5 bg-seat-available rounded-t-lg border border-gray-300 mr-2"></div>
        <span>Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-5 h-5 bg-seat-mine rounded-t-lg border border-gray-300 mr-2"></div>
        <span>Selected / Your Hold</span>
      </div>
      <div className="flex items-center">
        <div className="w-5 h-5 bg-seat-held rounded-t-lg border border-gray-300 mr-2"></div>
        <span>Held by Others</span>
      </div>
      <div className="flex items-center opacity-60">
        <div className="w-5 h-5 bg-seat-booked rounded-t-lg border border-gray-300 mr-2"></div>
        <span>Booked</span>
      </div>
    </div>
  );
}
