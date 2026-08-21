import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { BookingStatus } from '@prisma/client';

export async function getOrganiserDashboard(organiserId: string) {
  const events = await prisma.event.findMany({
    where: { organiserId },
    include: {
      shows: {
        include: {
          bookings: {
            where: { status: BookingStatus.CONFIRMED },
            select: { totalAmount: true },
          },
          _count: {
            select: {
              seats: { where: { status: 'BOOKED' } },
            },
          },
          venue: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dashboard = events.map((event) => {
    const shows = event.shows.map((show) => {
      const revenue = show.bookings.reduce(
        (sum, b) => sum + Number(b.totalAmount),
        0
      );
      return {
        id: show.id,
        date: show.date,
        time: show.time,
        venue: show.venue.name,
        bookedSeats: show._count.seats,
        revenue,
      };
    });

    const totalRevenue = shows.reduce((sum, s) => sum + s.revenue, 0);
    const totalBooked = shows.reduce((sum, s) => sum + s.bookedSeats, 0);

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      totalRevenue,
      totalBooked,
      shows,
    };
  });

  return dashboard;
}

export async function getEventSummary(eventId: string, organiserId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      shows: {
        include: {
          venue: { select: { name: true, address: true } },
          bookings: {
            where: { status: BookingStatus.CONFIRMED },
            include: {
              customer: { select: { name: true, email: true } },
              bookingSeats: {
                include: {
                  showSeat: {
                    include: {
                      seat: { select: { label: true, category: true } },
                    },
                  },
                },
              },
            },
          },
          pricing: true,
          _count: {
            select: {
              seats: true,
            },
          },
        },
      },
    },
  });

  if (!event) throw ApiError.notFound('Event not found');
  if (event.organiserId !== organiserId) throw ApiError.forbidden('Not your event');

  return event;
}
