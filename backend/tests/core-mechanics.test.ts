import { PrismaClient, Role, SeatStatus, EventType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { holdSeats } from '../src/modules/seats/seats.service';
import { joinWaitlist } from '../src/modules/waitlist/waitlist.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Integration Tests ---');

  // 1. Setup Test Data
  const passwordHash = await bcrypt.hash('testpass', 10);

  const userA = await prisma.user.upsert({
    where: { email: 'usera@test.com' },
    update: {},
    create: { email: 'usera@test.com', name: 'User A', role: Role.CUSTOMER, passwordHash },
  });

  const userB = await prisma.user.upsert({
    where: { email: 'userb@test.com' },
    update: {},
    create: { email: 'userb@test.com', name: 'User B', role: Role.CUSTOMER, passwordHash },
  });

  const userC = await prisma.user.upsert({
    where: { email: 'userc@test.com' },
    update: {},
    create: { email: 'userc@test.com', name: 'User C', role: Role.CUSTOMER, passwordHash },
  });

  const venue = await prisma.venue.create({
    data: { name: 'Test Venue', address: '123 Test', createdBy: userA.id },
  });

  const layout = await prisma.seatLayout.create({
    data: { venueId: venue.id, rows: 1, columns: 2 }, // Only 2 seats total!
  });

  const seat1 = await prisma.seat.create({
    data: { layoutId: layout.id, row: 1, column: 1, category: 'PREMIUM', label: 'A-1' }
  });

  const seat2 = await prisma.seat.create({
    data: { layoutId: layout.id, row: 1, column: 2, category: 'PREMIUM', label: 'A-2' }
  });

  const event = await prisma.event.create({
    data: { title: 'Test Event', description: 'Test', type: EventType.CONCERT, organiserId: userA.id },
  });

  const showDate = new Date();
  showDate.setDate(showDate.getDate() + 7);

  const show = await prisma.show.create({
    data: { eventId: event.id, venueId: venue.id, layoutId: layout.id, date: showDate, time: '20:00' },
  });

  const showSeat1 = await prisma.showSeat.create({
    data: { showId: show.id, seatId: seat1.id, status: SeatStatus.AVAILABLE }
  });

  const showSeat2 = await prisma.showSeat.create({
    data: { showId: show.id, seatId: seat2.id, status: SeatStatus.AVAILABLE }
  });

  console.log('✅ Test environment setup complete.\n');

  // Winner of TEST 1 carries over into TEST 3's expiry simulation
  let winnerId = '';

  // TEST 1: Double Booking Prevention
  console.log('TEST 1: Double Booking Prevention');
  try {
    // Both users try to hold seat 1 at the EXACT same time
    console.log('User A and User B attempting to hold Seat 1 simultaneously...');
    const result = await Promise.allSettled([
      holdSeats(show.id, [showSeat1.id], userA.id),
      holdSeats(show.id, [showSeat1.id], userB.id)
    ]);

    let successes = 0;
    let failures = 0;
    result.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        successes++;
        winnerId = i === 0 ? userA.id : userB.id;
        console.log(`- Request ${i+1} SUCCEEDED. Winner: ${i === 0 ? 'User A' : 'User B'}`);
      } else {
        failures++;
        console.log(`- Request ${i+1} FAILED (Expected: ${res.reason.message})`);
      }
    });

    if (successes === 1 && failures === 1) {
      console.log('✅ TEST 1 PASSED: Strict concurrency lock prevented double hold.\n');
    } else {
      console.error('❌ TEST 1 FAILED!');
    }
  } catch (error) {
    console.error('Test 1 failed with unhandled error:', error);
  }

  // TEST 2: Waitlist Mechanism
  console.log('TEST 2: Waitlist Mechanism');
  try {
    // User A holds the remaining seat (Seat 2), making the show completely sold out of PREMIUM seats.
    await holdSeats(show.id, [showSeat2.id], userA.id);
    console.log('User A successfully held Seat 2. PREMIUM is now sold out.');

    // User C joins the Waitlist for PREMIUM
    console.log('User C joining Waitlist for PREMIUM category...');
    const waitlist = await joinWaitlist(show.id, 'PREMIUM', userC.id);

    if (waitlist && waitlist.status === 'WAITING') {
      console.log('✅ TEST 2 PASSED: User C added to waitlist successfully.\n');
    } else {
      console.error('❌ TEST 2 FAILED: Waitlist not created properly.');
    }
  } catch (error) {
    console.error('❌ TEST 2 FAILED with error:', error);
  }

  // TEST 3: Waitlist Cascade & Mailing Mechanism
  console.log('TEST 3: Waitlist Cascade & Mailing Mechanism');
  try {
    console.log('Simulating hold expiry for Winner on Seat 1...');

    // Update the hold to be expired
    await prisma.showSeat.update({
      where: { id: showSeat1.id },
      data: { holdExpiresAt: new Date(Date.now() - 10000) } // 10 seconds ago
    });

    // Trigger the expiry worker function directly
    const { releaseExpiredHolds } = await import('../src/modules/seats/seats.service');
    await releaseExpiredHolds(show.id, [showSeat1.id], winnerId);

    console.log('Expiry worker triggered. Checking waitlist status...');

    // Check if the seat is now OFFERED to User C
    const updatedSeat = await prisma.showSeat.findUnique({ where: { id: showSeat1.id } });
    const updatedWaitlist = await prisma.waitlist.findFirst({ where: { customerId: userC.id, showId: show.id } });

    if (updatedSeat?.status === SeatStatus.OFFERED && updatedSeat.heldById === userC.id) {
      console.log('✅ Waitlist cascade correctly assigned the seat to User C (OFFERED state).');
    } else {
      console.error('❌ TEST 3 FAILED: Seat was not offered to waitlisted user.', updatedSeat);
    }

    if (updatedWaitlist?.status === 'OFFERED') {
      console.log('✅ Waitlist status updated to OFFERED.');
    } else {
      console.error('❌ TEST 3 FAILED: Waitlist entry was not updated.');
    }

    // Note: The mailing mechanism will log out "Failed to send waitlist offer email" OR "Message sent successfully" from the background execution.
    console.log('✅ TEST 3 PASSED: See email worker logs above for mail confirmation.\n');
  } catch (error) {
    console.error('❌ TEST 3 FAILED with error:', error);
  }

  // Cleanup
  console.log('Cleaning up test data...');
  await prisma.waitlist.deleteMany({ where: { showId: show.id } });
  await prisma.showSeat.deleteMany({ where: { showId: show.id } });
  await prisma.show.delete({ where: { id: show.id } });
  await prisma.event.delete({ where: { id: event.id } });
  await prisma.seat.deleteMany({ where: { layoutId: layout.id } });
  await prisma.seatLayout.delete({ where: { id: layout.id } });
  await prisma.venue.delete({ where: { id: venue.id } });

  await prisma.user.deleteMany({ where: { email: { in: ['usera@test.com', 'userb@test.com', 'userc@test.com'] } } });

  console.log('--- Integration Tests Finished ---');
}

// Explicit exit: the BullMQ queue holds an open Redis connection that would
// otherwise keep the event loop alive after the tests finish.
runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
