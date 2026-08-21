import { Prisma, SeatStatus, ShowSeat } from '@prisma/client';
import { prisma, env } from '../../config';
import { ApiError } from '../../middleware';
import { getSocketServer } from '../../sockets';
import { scheduleHoldExpiry } from '../../jobs/queues';

type ShowSeatWithSeat = ShowSeat & {
  seat: { row: number; column: number; category: string; label: string };
};

/**
 * LAZY EXPIRY CHECK — The most critical utility in the system.
 *
 * Before trusting any ShowSeat.status === 'HELD' or 'OFFERED', we check
 * whether the holdExpiresAt timestamp has passed. If so, we treat the seat
 * as AVAILABLE regardless of the stored status. This exists because our
 * free-tier backend host can sleep, causing BullMQ delayed jobs to fire late.
 * Correctness must never depend on the job firing on time.
 */
function resolveEffectiveStatus(seat: ShowSeat): SeatStatus {
  if (
    (seat.status === SeatStatus.HELD || seat.status === SeatStatus.OFFERED) &&
    seat.holdExpiresAt &&
    seat.holdExpiresAt <= new Date()
  ) {
    return SeatStatus.AVAILABLE;
  }
  return seat.status;
}

/**
 * Batch-resolve expired holds/offers in the database.
 * Called before returning seat data to ensure stale holds don't block users.
 */
async function resolveExpiredSeats(showId: string): Promise<void> {
  await prisma.showSeat.updateMany({
    where: {
      showId,
      status: { in: [SeatStatus.HELD, SeatStatus.OFFERED] },
      holdExpiresAt: { lte: new Date() },
    },
    data: {
      status: SeatStatus.AVAILABLE,
      heldById: null,
      holdExpiresAt: null,
    },
  });
}

/**
 * Get all seats for a show with resolved statuses.
 * Applies lazy-expiry resolution before returning data.
 */
export async function getShowSeats(showId: string) {
  // Batch-resolve any expired holds before fetching
  await resolveExpiredSeats(showId);

  const seats = await prisma.showSeat.findMany({
    where: { showId },
    include: {
      seat: {
        select: { row: true, column: true, category: true, label: true },
      },
    },
    orderBy: [
      { seat: { row: 'asc' } },
      { seat: { column: 'asc' } },
    ],
  });

  return seats.map((s) => ({
    id: s.id,
    showId: s.showId,
    seatId: s.seatId,
    status: resolveEffectiveStatus(s),
    heldById: resolveEffectiveStatus(s) === SeatStatus.AVAILABLE ? null : s.heldById,
    holdExpiresAt: resolveEffectiveStatus(s) === SeatStatus.AVAILABLE ? null : s.holdExpiresAt,
    row: s.seat.row,
    column: s.seat.column,
    category: s.seat.category,
    label: s.seat.label,
  }));
}

/**
 * SEAT HOLD — The core concurrency-safe mechanism.
 *
 * Uses a Prisma interactive transaction with SELECT FOR UPDATE to serialize
 * concurrent hold attempts. Combined with the partial unique index on
 * ShowSeat(showId, seatId) WHERE status IN ('HELD', 'BOOKED'), this provides
 * a belt-and-suspenders guarantee against double-holds.
 *
 * Flow:
 * 1. SELECT FOR UPDATE locks the target ShowSeat rows
 * 2. Lazy-expiry check on each row
 * 3. Verify all are AVAILABLE (or already held by this user for idempotency)
 * 4. Update to HELD with heldBy and holdExpiresAt
 * 5. Commit transaction
 * 6. Schedule BullMQ delayed job for proactive release
 * 7. Broadcast status change via Socket.io
 */
export async function holdSeats(
  showId: string,
  seatIds: string[],
  userId: string
) {
  const holdTtlMs = env.SEAT_HOLD_TTL_SECONDS * 1000;
  const holdExpiresAt = new Date(Date.now() + holdTtlMs);

  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Row-level lock via SELECT FOR UPDATE
    const showSeats = await tx.$queryRaw<ShowSeatWithSeat[]>`
      SELECT ss.*, 
             json_build_object(
               'row', s."row", 
               'column', s."column", 
               'category', s."category", 
               'label', s."label"
             ) as seat
      FROM show_seats ss
      JOIN seats s ON ss."seatId" = s.id
      WHERE ss."showId" = ${showId}
        AND ss."seatId" IN (${Prisma.join(seatIds)})
      FOR UPDATE OF ss
    `;

    if (showSeats.length !== seatIds.length) {
      throw ApiError.notFound('One or more seats not found for this show');
    }

    const unavailableSeats: string[] = [];
    const alreadyHeldByUser: string[] = [];
    const toUpdate: string[] = [];

    for (const seat of showSeats) {
      const effectiveStatus = resolveEffectiveStatus(seat);

      if (effectiveStatus === SeatStatus.AVAILABLE) {
        toUpdate.push(seat.id);
      } else if (
        seat.status === SeatStatus.HELD &&
        seat.heldById === userId &&
        seat.holdExpiresAt &&
        seat.holdExpiresAt > new Date()
      ) {
        // Idempotency: user already holds this seat and hold hasn't expired
        alreadyHeldByUser.push(seat.id);
      } else {
        unavailableSeats.push(seat.seatId);
      }
    }

    if (unavailableSeats.length > 0) {
      throw ApiError.conflict(
        `Seats no longer available: ${unavailableSeats.join(', ')}`
      );
    }

    // Update seats that need to transition to HELD
    if (toUpdate.length > 0) {
      await tx.showSeat.updateMany({
        where: { id: { in: toUpdate } },
        data: {
          status: SeatStatus.HELD,
          heldById: userId,
          holdExpiresAt,
        },
      });
    }

    // Also resolve any expired seats in this batch that we lazily detected
    await tx.showSeat.updateMany({
      where: {
        showId,
        status: { in: [SeatStatus.HELD, SeatStatus.OFFERED] },
        holdExpiresAt: { lte: new Date() },
        id: { notIn: [...toUpdate, ...alreadyHeldByUser] },
      },
      data: {
        status: SeatStatus.AVAILABLE,
        heldById: null,
        holdExpiresAt: null,
      },
    });

    return { updated: toUpdate, alreadyHeld: alreadyHeldByUser };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 10000,
  });

  // Post-commit: Schedule BullMQ delayed job for proactive release
  if (result.updated.length > 0) {
    await scheduleHoldExpiry(showId, result.updated, userId, holdTtlMs);
  }

  // Post-commit: Broadcast seat status changes via Socket.io
  const io = getSocketServer();
  if (io) {
    for (const seatId of seatIds) {
      io.to(`show:${showId}`).emit('seat:status-changed', {
        showId,
        seatId,
        status: SeatStatus.HELD,
        heldBy: userId,
      });
    }
  }

  return {
    held: result.updated.length + result.alreadyHeld.length,
    holdExpiresAt,
  };
}

/**
 * Release seats that a user currently holds.
 * Only the user who holds the seat (or an expired hold) can release it.
 */
export async function releaseSeats(
  showId: string,
  seatIds: string[],
  userId: string
) {
  const released = await prisma.showSeat.updateMany({
    where: {
      showId,
      seatId: { in: seatIds },
      status: SeatStatus.HELD,
      heldById: userId,
    },
    data: {
      status: SeatStatus.AVAILABLE,
      heldById: null,
      holdExpiresAt: null,
    },
  });

  // Broadcast release via Socket.io
  const io = getSocketServer();
  if (io) {
    for (const seatId of seatIds) {
      io.to(`show:${showId}`).emit('seat:status-changed', {
        showId,
        seatId,
        status: SeatStatus.AVAILABLE,
        heldBy: null,
      });
    }
  }

  return { released: released.count };
}

/**
 * Proactive hold release — called by the BullMQ worker when a hold TTL expires.
 * Only releases seats that are still HELD by the original user and expired.
 * This is the proactive counterpart to the lazy-expiry check.
 */
export async function releaseExpiredHolds(
  showId: string,
  showSeatIds: string[],
  userId: string
) {
  const released = await prisma.showSeat.updateMany({
    where: {
      id: { in: showSeatIds },
      showId,
      status: SeatStatus.HELD,
      heldById: userId,
      holdExpiresAt: { lte: new Date() },
    },
    data: {
      status: SeatStatus.AVAILABLE,
      heldById: null,
      holdExpiresAt: null,
    },
  });

  if (released.count > 0) {
    const io = getSocketServer();
    if (io) {
      // Fetch the actual seatIds for the socket event
      const seats = await prisma.showSeat.findMany({
        where: { id: { in: showSeatIds } },
        select: { seatId: true },
      });

      for (const seat of seats) {
        io.to(`show:${showId}`).emit('seat:status-changed', {
          showId,
          seatId: seat.seatId,
          status: SeatStatus.AVAILABLE,
          heldBy: null,
        });
      }
    }
  }

  return { released: released.count };
}
