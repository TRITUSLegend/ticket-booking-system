import { prisma } from './src/config';

async function run() {
  const venues = await prisma.venue.findMany({
    where: { name: { contains: 'Grand Arena', mode: 'insensitive' } },
    include: { layouts: { select: { id: true } } }
  });

  for (const v of venues) {
    console.log('Deleting', v.name);
    const layoutIds = v.layouts.map(l => l.id);
    await prisma.$transaction(async (tx) => {
      const shows = await tx.show.findMany({ where: { venueId: v.id } });
      const showIds = shows.map(s => s.id);
      
      if (showIds.length > 0) {
        await tx.bookingSeat.deleteMany({ where: { showSeat: { showId: { in: showIds } } } });
        await tx.booking.deleteMany({ where: { showId: { in: showIds } } });
        await tx.waitlist.deleteMany({ where: { showId: { in: showIds } } });
        await tx.showSeat.deleteMany({ where: { showId: { in: showIds } } });
        await tx.showSeatPricing.deleteMany({ where: { showId: { in: showIds } } });
        await tx.show.deleteMany({ where: { venueId: v.id } });
      }
      
      if (layoutIds.length > 0) {
        await tx.seat.deleteMany({ where: { layoutId: { in: layoutIds } } });
        await tx.seatLayout.deleteMany({ where: { venueId: v.id } });
      }
      
      await tx.venue.delete({ where: { id: v.id } });
    });
    console.log('Deleted', v.name);
  }
}
run().catch(console.error).finally(() => process.exit(0));
