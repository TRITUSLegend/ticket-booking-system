import { PrismaClient, Role, EventType, SeatCategory, SeatStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', name: 'System Admin', role: Role.ADMIN, passwordHash },
  });

  const organiser = await prisma.user.upsert({
    where: { email: 'organiser@test.com' },
    update: {},
    create: { email: 'organiser@test.com', name: 'Event Organiser', role: Role.ORGANISER, passwordHash },
  });

  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: { email: 'customer@test.com', name: 'Test Customer', role: Role.CUSTOMER, passwordHash },
  });

  // 2. Venue
  const venue = await prisma.venue.create({
    data: { name: 'Grand Arena', address: '123 Main St', createdBy: admin.id },
  });

  const layout = await prisma.seatLayout.create({
    data: { venueId: venue.id, rows: 5, columns: 10 },
  });

  // 3. Seats
  const seatsData = [];
  for (let r = 1; r <= 5; r++) {
    const category = r <= 2 ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
    const rowLetter = String.fromCharCode(64 + r);
    for (let c = 1; c <= 10; c++) {
      seatsData.push({
        layoutId: layout.id,
        row: r,
        column: c,
        category,
        label: `${rowLetter}-${c}`,
      });
    }
  }
  await prisma.seat.createMany({ data: seatsData });
  const seats = await prisma.seat.findMany({ where: { layoutId: layout.id } });

  // 4. Seeding of dummy events has been removed per user request.

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
