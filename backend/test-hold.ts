import { holdSeats, getShowSeats } from './src/modules/seats/seats.service';
import { prisma } from './src/config';

async function testHold() {
  try {
    const show = await prisma.show.findFirst();
    if (!show) {
      console.log('No show found');
      return;
    }
    const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    if (!user) {
      console.log('No customer found');
      return;
    }
    const seats = await getShowSeats(show.id);
    const available = seats.filter(s => s.status === 'AVAILABLE');
    if (available.length === 0) {
      console.log('No available seats');
      return;
    }
    
    console.log(`Holding seat ${available[0].label} for show ${show.id}`);
    
    const result = await holdSeats(show.id, [available[0].seatId], user.id);
    console.log('Hold successful:', result);
    
  } catch (err: any) {
    console.error('Hold failed:', err.message);
  } finally {
    process.exit(0);
  }
}

testHold();
