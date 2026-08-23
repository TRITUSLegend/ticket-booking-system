import { prisma, env } from '../../config';
import { ApiError } from '../../middleware';
import { SeatStatus, WaitlistStatus } from '@prisma/client';
import { signWaitlistOffer, verifyWaitlistOffer } from '../../lib/crypto';
import { sendWaitlistOfferEmail } from '../../lib/email';
import { scheduleOfferExpiry } from '../../jobs/queues';
import { getSocketServer } from '../../sockets';

export async function joinWaitlist(showId: string, category: string, userId: string) {
  const existing = await prisma.waitlist.findFirst({
    where: { showId, category, customerId: userId, status: WaitlistStatus.WAITING },
  });

  if (existing) {
    throw ApiError.conflict('You are already on the waitlist for this category');
  }

  return prisma.waitlist.create({
    data: {
      showId,
      category,
      customerId: userId,
      status: WaitlistStatus.WAITING,
    },
  });
}

/**
 * Waitlist Cascade Core Logic
 * Called when a booking is cancelled OR an offer expires.
 */
export async function processWaitlistOnCancellation(showId: string, category: string, seatId: string) {
  const ttlMs = env.WAITLIST_OFFER_TTL_SECONDS * 1000;
  const offerExpiresAt = new Date(Date.now() + ttlMs);

  const result = await prisma.$transaction(async (tx) => {
    // Find oldest waiting entry
    const entry = await tx.$queryRaw<{ id: string; customerId: string }[]>`
      SELECT id, "customerId"
      FROM waitlist
      WHERE "showId" = ${showId}
        AND category = ${category}
        AND status = 'WAITING'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (entry.length === 0) {
      // No one waiting, just make seat available
      await tx.showSeat.update({
        where: { id: seatId },
        data: { status: SeatStatus.AVAILABLE, holdExpiresAt: null, heldById: null },
      });
      return null; // No offer made
    }

    const waitlistId = entry[0].id;
    const customerId = entry[0].customerId;

    // Update waitlist
    await tx.waitlist.update({
      where: { id: waitlistId },
      data: { status: WaitlistStatus.OFFERED, offerExpiresAt },
    });

    // Update seat to OFFERED
    await tx.showSeat.update({
      where: { id: seatId },
      data: { status: SeatStatus.OFFERED, heldById: customerId, holdExpiresAt: offerExpiresAt },
    });

    return { waitlistId, customerId };
  });

  if (result) {
    // Deliver Offer
    const user = await prisma.user.findUnique({ where: { id: result.customerId } });
    const showInfo = await prisma.show.findUnique({
      where: { id: showId },
      include: { event: true, venue: true },
    });

    if (user && showInfo) {
      const token = signWaitlistOffer(result.waitlistId, offerExpiresAt);
      const offerLink = `${env.FRONTEND_URL}/events/${showInfo.eventId}/shows/${showId}/offer?token=${token}`;

      sendWaitlistOfferEmail({
        to: user.email,
        customerName: user.name,
        eventTitle: showInfo.event.title,
        showDate: showInfo.date.toISOString().split('T')[0],
        showTime: showInfo.time,
        venueName: showInfo.venue.name,
        category,
        offerExpiresAt: offerExpiresAt.toLocaleString(),
        offerLink,
      }).catch(console.error);
    }

    // Schedule expiry job
    await scheduleOfferExpiry(result.waitlistId, ttlMs);

    // Socket update
    const io = getSocketServer();
    if (io) {
      io.to(`show:${showId}`).emit('seat:status-changed', {
        showId,
        seatId,
        status: SeatStatus.OFFERED,
      });
    }
  } else {
    // Broadcast it's available
    const io = getSocketServer();
    if (io) {
      io.to(`show:${showId}`).emit('seat:status-changed', {
        showId,
        seatId,
        status: SeatStatus.AVAILABLE,
      });
    }
  }
}

export async function expireOffer(waitlistId: string) {
  const waitlist = await prisma.waitlist.findUnique({ where: { id: waitlistId } });

  if (!waitlist || waitlist.status !== WaitlistStatus.OFFERED) {
    return;
  }

  // Only expire if it actually expired (lazy check counterpart)
  if (waitlist.offerExpiresAt && waitlist.offerExpiresAt > new Date()) {
    return;
  }

  await prisma.waitlist.update({
    where: { id: waitlistId },
    data: { status: WaitlistStatus.EXPIRED },
  });

  // Find the seat that was tied to this offer
  const seat = await prisma.showSeat.findFirst({
    where: { showId: waitlist.showId, status: SeatStatus.OFFERED, heldById: waitlist.customerId },
  });

  if (seat) {
    // CASCADE: Call the process logic again to offer to the next person
    await processWaitlistOnCancellation(waitlist.showId, waitlist.category, seat.id);
  }
}

export async function completeOffer(token: string, userId: string) {
  const verified = verifyWaitlistOffer(token);
  if (!verified) {
    throw ApiError.badRequest('Invalid or expired offer link');
  }

  const waitlist = await prisma.waitlist.findUnique({ where: { id: verified.waitlistId } });

  if (!waitlist || waitlist.customerId !== userId) {
    throw ApiError.forbidden('Offer does not belong to you');
  }

  if (waitlist.status !== WaitlistStatus.OFFERED) {
    throw ApiError.conflict(`Offer is no longer active (Status: ${waitlist.status})`);
  }

  // Convert the offer into a normal hold with a fresh TTL and hand the seat back
  // to the frontend, which routes the customer through the standard checkout flow.
  const seat = await prisma.showSeat.findFirst({
    where: { showId: waitlist.showId, status: SeatStatus.OFFERED, heldById: userId },
  });

  if (!seat) {
    throw ApiError.notFound('Seat attached to offer not found');
  }

  const holdTtlMs = env.SEAT_HOLD_TTL_SECONDS * 1000;

  await prisma.$transaction([
    prisma.waitlist.update({
      where: { id: waitlist.id },
      data: { status: WaitlistStatus.BOOKED },
    }),
    prisma.showSeat.update({
      where: { id: seat.id },
      data: {
        status: SeatStatus.HELD,
        holdExpiresAt: new Date(Date.now() + holdTtlMs)
      }
    })
  ]);

  // ShowSeat id, not Seat id: this is what /seats/hold and /bookings/checkout
  // expect in their seatIds arrays, and the frontend forwards it straight there.
  return { seatId: seat.id, showId: waitlist.showId };
}
