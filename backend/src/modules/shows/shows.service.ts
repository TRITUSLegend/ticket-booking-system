import { prisma } from '../../config';
import { sendCancellationEmail } from '../../lib/email';
import { ApiError } from '../../middleware';
import { CreateShowInput } from './shows.validation';
import { SeatStatus } from '@prisma/client';

export async function createShow(data: CreateShowInput, organiserId: string) {
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
  });

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.organiserId !== organiserId) {
    throw ApiError.forbidden('You can only create shows for your own events');
  }

  const venue = await prisma.venue.findUnique({
    where: { id: data.venueId },
    include: {
      layouts: {
        include: {
          seats: true,
        },
      },
    },
  });

  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  // Use the first available layout for the venue
  const layout = venue.layouts[0];
  if (!layout) {
    throw ApiError.badRequest('Venue must have a layout before scheduling shows');
  }

  if (venue.supportedEventTypes.length > 0 && !venue.supportedEventTypes.includes(event.type)) {
    throw ApiError.badRequest(`This venue does not support ${event.type} events.`);
  }

  // Verify pricing covers all categories present in the layout
  const layoutCategories = new Set(layout.seats.map(s => s.category));
  const pricingCategories = new Set(data.pricing.map(p => p.category));

  for (const cat of layoutCategories) {
    if (!pricingCategories.has(cat)) {
      throw ApiError.badRequest(`Missing pricing for category: ${cat}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const show = await tx.show.create({
      data: {
        eventId: data.eventId,
        venueId: data.venueId,
        layoutId: layout.id,
        date: new Date(data.date),
        time: data.time,
      },
    });

    const pricingToCreate = data.pricing.map((p) => ({
      showId: show.id,
      category: p.category,
      price: p.price,
    }));

    await tx.showSeatPricing.createMany({
      data: pricingToCreate,
    });

    const showSeatsToCreate = layout.seats.map((seat) => ({
      showId: show.id,
      seatId: seat.id,
      status: SeatStatus.AVAILABLE,
    }));

    // Batch insert ShowSeats
    // Depending on grid size, this could be large, but Prisma handle it well up to a few thousand rows
    await tx.showSeat.createMany({
      data: showSeatsToCreate,
    });

    return show;
  });
}

export async function getShowById(id: string) {
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      event: { select: { title: true, type: true } },
      venue: { select: { name: true, address: true } },
      pricing: true,
      layout: { select: { rows: true, columns: true, shape: true } },
    },
  });

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  // We could also aggregate seat counts here if needed
  return show;
}

export async function getShowsByEvent(eventId: string) {
  return prisma.show.findMany({
    where: { eventId },
    include: {
      venue: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });
}

export async function deleteShow(showId: string, organiserId: string) {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: { event: true },
  });

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  if (show.event.organiserId !== organiserId) {
    throw ApiError.forbidden('You can only delete shows for your own events');
  }

  // Fetch all bookings for this show to send cancellation emails
  const bookings = await prisma.booking.findMany({
    where: { showId },
    include: { customer: true }
  });

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
      eventTitle: `${show.event.title} (Show: ${new Date(show.date).toLocaleDateString()} at ${show.time})`,
    }).catch(console.error);
  }

  // Cascade delete all related data in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.bookingSeat.deleteMany({ where: { showSeat: { showId } } });
    await tx.booking.deleteMany({ where: { showId } });
    await tx.waitlist.deleteMany({ where: { showId } });
    await tx.showSeat.deleteMany({ where: { showId } });
    await tx.showSeatPricing.deleteMany({ where: { showId } });
    await tx.show.delete({ where: { id: showId } });
  });

  return { success: true };
}
