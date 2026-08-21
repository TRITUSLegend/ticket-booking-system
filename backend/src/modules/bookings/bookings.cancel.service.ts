import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { BookingStatus } from '@prisma/client';
import { processWaitlistOnCancellation } from '../waitlist/waitlist.service';

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { show: true, bookingSeats: { include: { showSeat: { include: { seat: true } } } } },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.customerId !== userId) {
    throw ApiError.forbidden('You cannot cancel this booking');
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw ApiError.badRequest('Booking is already cancelled');
  }

  // Cannot cancel past shows
  if (booking.show.date < new Date()) {
    throw ApiError.badRequest('Cannot cancel past shows');
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  // Trigger waitlist cascade for each freed seat
  for (const bs of booking.bookingSeats) {
    await processWaitlistOnCancellation(
      booking.showId,
      bs.showSeat.seat.category,
      bs.showSeatId
    );
  }

  return { status: 'CANCELLED' };
}
