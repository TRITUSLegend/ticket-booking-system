export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ORGANISER' | 'ADMIN';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'MOVIE' | 'CONCERT';
  organiserId: string;
  createdAt: string;
}

export interface Show {
  id: string;
  eventId: string;
  venueId: string;
  date: string;
  time: string;
}

export interface SeatData {
  id: string;
  row: number;
  column: number;
  category: string;
  label: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'OFFERED';
  heldById: string | null;
  holdExpiresAt: string | null;
}

export interface Booking {
  id: string;
  status: 'CONFIRMED' | 'CANCELLED';
  totalAmount: string;
  qrReference: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}
