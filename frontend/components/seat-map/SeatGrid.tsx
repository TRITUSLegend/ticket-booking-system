'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Seat } from './Seat';
import { getSocket } from '../../lib/socket-client';
import { useAuth } from '../../lib/auth-context';

export type SeatData = {
  id: string;
  row: number;
  column: number;
  category: string;
  label: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OFFERED';
  heldById: string | null;
  holdExpiresAt: string | null;
};

interface SeatGridProps {
  showId: string;
  initialSeats: SeatData[];
  shape?: 'RECTANGULAR' | 'CIRCULAR' | 'STAGE';
  onSelectionChange: (selectedSeatIds: string[]) => void;
}

export function SeatGrid({ showId, initialSeats, shape = 'RECTANGULAR', onSelectionChange }: SeatGridProps) {
  const [seats, setSeats] = useState<Record<string, SeatData>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Initialize seats map
  useEffect(() => {
    const seatMap: Record<string, SeatData> = {};
    initialSeats.forEach((s) => {
      seatMap[s.id] = s;
    });
    setSeats(seatMap);
  }, [initialSeats]);

  // Handle Real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('joinShow', showId);

    const handleStatusChange = (data: { showId: string; seatId: string; status: SeatData['status']; heldBy?: string }) => {
      if (data.showId !== showId) return;

      setSeats((prev) => {
        const seat = prev[data.seatId];
        if (!seat) return prev;

        // If a seat we selected was booked/held by someone else, deselect it
        if (
          selectedIds.has(data.seatId) &&
          data.status !== 'AVAILABLE' &&
          data.heldBy !== user?.id
        ) {
          const newSelected = new Set(selectedIds);
          newSelected.delete(data.seatId);
          setSelectedIds(newSelected);
          onSelectionChange(Array.from(newSelected));
        }

        return {
          ...prev,
          [data.seatId]: { ...seat, status: data.status, heldById: data.heldBy || null },
        };
      });
    };

    socket.on('seat:status-changed', handleStatusChange);

    return () => {
      socket.emit('leaveShow', showId);
      socket.off('seat:status-changed', handleStatusChange);
    };
  }, [showId, user?.id, selectedIds, onSelectionChange]);

  const handleSelect = (seatId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      if (newSelected.size >= 10) {
        alert('You can only select up to 10 seats');
        return;
      }
      newSelected.add(seatId);
    }
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  // Group by row
  const rows = useMemo(() => {
    const grouped: Record<number, SeatData[]> = {};
    Object.values(seats).forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });

    Object.values(grouped).forEach((row) => row.sort((a, b) => a.column - b.column));
    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  }, [seats]);

  const renderRows = (rowsToRender: typeof rows, isTopHalf: boolean = false) => {
    const displayRows = isTopHalf ? [...rowsToRender].reverse() : rowsToRender;

    return displayRows.map(([rowNum, rowSeats]) => (
      <div key={rowNum} className="flex items-center justify-center space-x-4 mb-2">
        <div className="w-6 text-right text-sm font-bold text-gray-400">
          {String.fromCharCode(64 + Number(rowNum))}
        </div>
        <div className={`flex space-x-2 ${isTopHalf ? 'rotate-180' : ''}`}>
          {rowSeats.map((seat) => {
            const isMine =
              (seat.status === 'HELD' && seat.heldById === user?.id) ||
              selectedIds.has(seat.id);
            return (
              <div key={seat.id} className={isTopHalf ? 'rotate-180' : ''}>
                <Seat
                  id={seat.id}
                  label={seat.label}
                  status={seat.status}
                  category={seat.category}
                  isMine={isMine}
                  onSelect={handleSelect}
                />
              </div>
            );
          })}
        </div>
        <div className="w-6 text-left text-sm font-bold text-gray-400">
          {String.fromCharCode(64 + Number(rowNum))}
        </div>
      </div>
    ));
  };

  return (
    <div className="overflow-x-auto p-4 w-full">
      <div className="min-w-max mx-auto">
        
        {shape === 'RECTANGULAR' && (
          <>
            <div className="w-3/4 mx-auto h-8 bg-gray-200 rounded-b-[50%] border-t-4 border-gray-400 text-center text-xs font-semibold text-gray-500 pt-1 mb-12 shadow-inner">
              SCREEN
            </div>
            {renderRows(rows)}
          </>
        )}

        {shape === 'STAGE' && (
          <>
            <div className="w-3/4 mx-auto h-16 bg-gray-900 rounded-b-full border-t-8 border-black text-center flex items-center justify-center text-white font-bold tracking-widest mb-16 shadow-2xl shadow-gray-900/50">
              STAGE
            </div>
            {renderRows(rows)}
          </>
        )}

        {shape === 'CIRCULAR' && (
          <>
            {renderRows(rows.slice(0, Math.ceil(rows.length / 2)), true)}
            <div className="w-full max-w-2xl mx-auto h-40 bg-green-50 border-4 border-green-200 rounded-[100px] my-10 flex items-center justify-center text-green-700 font-bold uppercase tracking-[0.3em] shadow-inner">
              Pitch / Court
            </div>
            {renderRows(rows.slice(Math.ceil(rows.length / 2)), false)}
          </>
        )}

      </div>
    </div>
  );
}
