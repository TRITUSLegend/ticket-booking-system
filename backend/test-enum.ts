import { prisma } from './src/config';

async function testEvent() {
  const organiser = await prisma.user.findFirst({ where: { role: 'ORGANISER' } });
  if (!organiser) throw new Error('No organiser found');
  
  const event = await prisma.event.create({
    data: {
      title: 'Test Sports',
      description: 'Test Description 10 chars',
      type: 'SPORTS',
      organiserId: organiser.id
    }
  });
  console.log('Successfully created:', event);
  
  // Clean up
  await prisma.event.delete({ where: { id: event.id } });
}

testEvent().catch(console.error).finally(() => process.exit(0));
