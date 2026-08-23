import crypto from 'crypto';
import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { CheckoutInput } from './bookings.validation';
import { BookingStatus, Prisma, SeatStatus, ShowSeat } from '@prisma/client';
import { generateQrReference } from '../../lib/crypto';
import { sendBookingConfirmation } from '../../lib/email';
import { getSocketServer } from '../../sockets';

export async function checkout(data: CheckoutInput, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Lock the seats
    const showSeats = await tx.$queryRaw<ShowSeat[]>`
      SELECT * FROM show_seats
      WHERE "showId" = ${data.showId}
        AND id IN (${Prisma.join(data.seatIds)})
      FOR UPDATE
    `;

    if (showSeats.length !== data.seatIds.length) {
      throw ApiError.notFound('One or more seats not found');
    }

    // 2. Verify all are held by the current user and not expired
    const expiredSeats = [];
    const notHeldByMe = [];

    for (const seat of showSeats) {
      if (seat.status !== SeatStatus.HELD) {
        notHeldByMe.push(seat.seatId);
        continue;
      }
      if (seat.heldById !== userId) {
        notHeldByMe.push(seat.seatId);
        continue;
      }
      if (seat.holdExpiresAt && seat.holdExpiresAt <= new Date()) {
        expiredSeats.push(seat.seatId);
        
        // Optimistically fix the state for the next person
        await tx.showSeat.update({
          where: { id: seat.id },
          data: { status: SeatStatus.AVAILABLE, heldById: null, holdExpiresAt: null },
        });
      }
    }

    if (expiredSeats.length > 0) {
      throw ApiError.conflict(`Your hold on these seats has expired: ${expiredSeats.join(', ')}`);
    }

    if (notHeldByMe.length > 0) {
      throw ApiError.forbidden(`You do not hold these seats: ${notHeldByMe.join(', ')}`);
    }

    // 3. Calculate total amount
    const showSeatsWithPricing = await tx.showSeat.findMany({
      where: { id: { in: showSeats.map(s => s.id) } },
      include: {
        seat: true,
        show: {
          include: {
            pricing: true,
            event: true,
            venue: true,
          }
        }
      }
    });

    const showInfo = showSeatsWithPricing[0].show;

    let totalAmount = 0;
    const seatLabels: string[] = [];

    for (const ss of showSeatsWithPricing) {
      const pricing = showInfo.pricing.find(p => p.category === ss.seat.category);
      if (!pricing) {
        throw ApiError.internal(`Pricing not found for category ${ss.seat.category}`);
      }
      totalAmount += Number(pricing.price);
      seatLabels.push(ss.seat.label);
    }


    // 4. Create Booking
    const booking = await tx.booking.create({
      data: {
        customerId: userId,
        showId: data.showId,
        status: BookingStatus.CONFIRMED,
        totalAmount,
        qrReference: 'PENDING_' + crypto.randomUUID(), // Prevent unique constraint collisions
      },
    });

    const qrReference = generateQrReference(booking.id);

    await tx.booking.update({
      where: { id: booking.id },
      data: { qrReference },
    });

    // 5. Create BookingSeats and update ShowSeats
    const bookingSeatsData = showSeats.map(ss => ({
      bookingId: booking.id,
      showSeatId: ss.id,
    }));

    await tx.bookingSeat.createMany({ data: bookingSeatsData });

    await tx.showSeat.updateMany({
      where: { id: { in: showSeats.map(s => s.id) } },
      data: {
        status: SeatStatus.BOOKED,
        bookingId: booking.id,
        holdExpiresAt: null, // Holds are cleared
      },
    });

    return {
      booking: { ...booking, qrReference },
      showInfo,
      seatLabels,
    };
  }, {
    maxWait: 5000, // default is 2000
    timeout: 20000, // default is 5000
  });

  // Post-commit: Email and Socket
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user) {
    sendBookingConfirmation({
      to: user.email,
      customerName: user.name,
      eventTitle: result.showInfo.event.title,
      showDate: result.showInfo.date.toISOString().split('T')[0],
      showTime: result.showInfo.time,
      venueName: result.showInfo.venue.name,
      seats: result.seatLabels,
      totalAmount: result.booking.totalAmount.toString(),
      qrReference: result.booking.qrReference,
      bookingId: result.booking.id,
    }).catch(console.error); // Fire and forget
  }

  const io = getSocketServer();
  if (io) {
    for (const seatId of data.seatIds) {
      io.to(`show:${data.showId}`).emit('seat:status-changed', {
        showId: data.showId,
        seatId,
        status: SeatStatus.BOOKED,
      });
    }
  }

  return {
    bookingId: result.booking.id,
    qrReference: result.booking.qrReference,
    totalAmount: result.booking.totalAmount,
  };
}

export async function getBookingHistory(userId: string) {
  return prisma.booking.findMany({
    where: { customerId: userId },
    include: {
      show: {
        include: {
          event: { select: { title: true } },
          venue: { select: { name: true } },
        },
      },
      bookingSeats: {
        include: {
          showSeat: {
            include: {
              seat: { select: { label: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export { cancelBooking } from './bookings.cancel.service';
