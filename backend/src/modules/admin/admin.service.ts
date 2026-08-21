import { prisma } from '../../config';
import { BookingStatus } from '@prisma/client';

export async function getDashboardStats() {
  const [
    totalUsers,
    totalVenues,
    totalEvents,
    revenueData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.venue.count(),
    prisma.event.count(),
    prisma.booking.aggregate({
      where: { status: BookingStatus.CONFIRMED },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalUsers,
    totalVenues,
    totalEvents,
    totalRevenue: revenueData._sum.totalAmount || 0,
  };
}
