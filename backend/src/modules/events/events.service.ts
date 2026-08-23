import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { CreateEventInput } from './events.validation';
import { EventType, Prisma } from '@prisma/client';
import { sendCancellationEmail } from '../../lib/email';

export async function createEvent(data: CreateEventInput, organiserId: string) {
  return prisma.event.create({
    data: {
      ...data,
      organiserId,
    },
  });
}

export async function getEvents(filters?: { type?: EventType; search?: string }) {
  const where: Prisma.EventWhereInput = {};

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.search) {
    where.title = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  return prisma.event.findMany({
    where,
    include: {
      _count: {
        select: { shows: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organiser: {
        select: { name: true },
      },
      shows: {
        include: {
          venue: {
            select: { name: true, address: true },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  return event;
}

export async function deleteEvent(eventId: string, organiserId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      shows: true,
    }
  });

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.organiserId !== organiserId) {
    throw ApiError.forbidden('You can only delete your own events');
  }

  const showIds = event.shows.map(s => s.id);

  if (showIds.length > 0) {
    // 1. Fetch all bookings for these shows to send cancellation emails
    const bookings = await prisma.booking.findMany({
      where: { showId: { in: showIds } },
      include: { customer: true }
    });

    // Send emails (Unique per customer to avoid spamming if they booked multiple times, but let's just send per booking to be safe or unique them)
    const uniqueCustomers = new Map();
    for (const b of bookings) {
      if (!uniqueCustomers.has(b.customer.email)) {
        uniqueCustomers.set(b.customer.email, b.customer.name);
      }
    }

    // Fire & forget emails
    for (const [email, name] of Array.from(uniqueCustomers.entries())) {
      sendCancellationEmail({
        to: email,
        customerName: name,
        eventTitle: event.title,
      }).catch(console.error);
    }
  }

  // 2. Cascade delete all related data in a transaction
  await prisma.$transaction(async (tx) => {
    if (showIds.length > 0) {
      await tx.bookingSeat.deleteMany({ where: { showSeat: { showId: { in: showIds } } } });
      await tx.booking.deleteMany({ where: { showId: { in: showIds } } });
      await tx.waitlist.deleteMany({ where: { showId: { in: showIds } } });
      await tx.showSeat.deleteMany({ where: { showId: { in: showIds } } });
      await tx.showSeatPricing.deleteMany({ where: { showId: { in: showIds } } });
      await tx.show.deleteMany({ where: { eventId } });
    }
    await tx.event.delete({ where: { id: eventId } });
  });

  return { success: true };
}
