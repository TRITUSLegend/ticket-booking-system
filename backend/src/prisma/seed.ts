import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', name: 'System Admin', role: Role.ADMIN, passwordHash },
  });

  await prisma.user.upsert({
    where: { email: 'organiser@test.com' },
    update: {},
    create: { email: 'organiser@test.com', name: 'Event Organiser', role: Role.ORGANISER, passwordHash },
  });

  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: { email: 'customer@test.com', name: 'Test Customer', role: Role.CUSTOMER, passwordHash },
  });

  // Seeding of dummy venue has been removed per user request.

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
