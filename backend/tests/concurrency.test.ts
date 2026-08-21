import { PrismaClient, Role, EventType, SeatCategory, SeatStatus } from '@prisma/client';
import { holdSeats } from '../src/modules/seats/seats.service';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('--- Starting Concurrency Test ---');
  
  // 1. Setup Data
  const admin = await prisma.user.create({
    data: { email: 'admin-test@test.com', passwordHash: 'hash', name: 'Admin', role: Role.ADMIN },
  });

  const venue = await prisma.venue.create({
    data: { name: 'Test Venue', address: '123 Test St', createdBy: admin.id },
  });

  const layout = await prisma.seatLayout.create({
    data: { venueId: venue.id, rows: 1, columns: 1 },
  });

  const seat = await prisma.seat.create({
    data: { layoutId: layout.id, row: 1, column: 1, category: SeatCategory.PREMIUM, label: 'A-1' },
  });

  const event = await prisma.event.create({
    data: { title: 'Test Event', description: 'Desc', type: EventType.CONCERT, organiserId: admin.id },
  });

  const show = await prisma.show.create({
    data: { eventId: event.id, venueId: venue.id, layoutId: layout.id, date: new Date(), time: '20:00' },
  });

  const showSeat = await prisma.showSeat.create({
    data: { showId: show.id, seatId: seat.id, status: SeatStatus.AVAILABLE },
  });

  // Create 20 test users
  const users = await Promise.all(
    Array.from({ length: 20 }).map((_, i) =>
      prisma.user.create({
        data: { email: `user${i}@test.com`, passwordHash: 'hash', name: `User ${i}`, role: Role.CUSTOMER },
      })
    )
  );

  console.log('✅ Setup complete. Firing 20 concurrent hold requests for the same seat...');

  // 2. Fire concurrent requests
  const results = await Promise.allSettled(
    users.map((user) => holdSeats(show.id, [seat.id], user.id))
  );

  // 3. Analyze results
  const successes = results.filter((r) => r.status === 'fulfilled');
  const failures = results.filter((r) => r.status === 'rejected');

  console.log(`Successes: ${successes.length}`);
  console.log(`Failures: ${failures.length}`);

  if (successes.length === 1 && failures.length === 19) {
    console.log('✅ Concurrency test PASSED. Exactly 1 user secured the seat.');
  } else {
    console.error('❌ Concurrency test FAILED.');
  }

  // Verify DB state
  const dbSeat = await prisma.showSeat.findUnique({ where: { id: showSeat.id } });
  console.log(`Final DB Seat Status: ${dbSeat?.status}, HeldBy: ${dbSeat?.heldById}`);

  // 4. Cleanup
  console.log('Cleaning up test data...');
  await prisma.showSeat.deleteMany({ where: { showId: show.id } });
  await prisma.show.delete({ where: { id: show.id } });
  await prisma.event.delete({ where: { id: event.id } });
  await prisma.seat.deleteMany({ where: { layoutId: layout.id } });
  await prisma.seatLayout.delete({ where: { id: layout.id } });
  await prisma.venue.delete({ where: { id: venue.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, ...users.map(u => u.id)] } } });

  await prisma.$disconnect();
}

runConcurrencyTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
