import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteEvent(title: string) {
  console.log(`Starting deletion for event: ${title}`);
  
  const event = await prisma.event.findFirst({
    where: { title },
    include: {
      shows: true
    }
  });

  if (!event) {
    console.log(`Event '${title}' not found.`);
    process.exit(0);
  }

  console.log(`Found event: ${event.id}`);

  for (const show of event.shows) {
    console.log(`Deleting data for show: ${show.id}`);
    
    // 1. BookingSeats
    await prisma.bookingSeat.deleteMany({
      where: {
        booking: {
          showId: show.id
        }
      }
    });

    // 2. Bookings
    await prisma.booking.deleteMany({
      where: { showId: show.id }
    });

    // 3. Waitlist
    await prisma.waitlist.deleteMany({
      where: { showId: show.id }
    });

    // 4. ShowSeats
    await prisma.showSeat.deleteMany({
      where: { showId: show.id }
    });

    // 5. ShowSeatPricing
    await prisma.showSeatPricing.deleteMany({
      where: { showId: show.id }
    });

    // 6. Show itself
    await prisma.show.delete({
      where: { id: show.id }
    });
  }

  // 7. Finally, delete the Event
  await prisma.event.delete({
    where: { id: event.id }
  });

  console.log(`✅ Successfully deleted event '${title}' and all associated data.`);
}

deleteEvent('Rock Concert')
  .catch(console.error)
  .finally(() => prisma.$disconnect());
