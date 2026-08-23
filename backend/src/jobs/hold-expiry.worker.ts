import { Worker } from 'bullmq';
import { redis } from '../config';
import { releaseExpiredHolds } from '../modules/seats/seats.service';

export const holdExpiryWorker = new Worker(
  'hold-expiry',
  async (job) => {
    const { showId, seatIds, userId } = job.data;
    console.log(`[Job] Executing hold-expiry for show ${showId}, seats ${seatIds.join(',')}`);

    // Call the service to release seats if they are still held and expired
    const result = await releaseExpiredHolds(showId, seatIds, userId);

    if (result.released > 0) {
      console.log(`[Job] Released ${result.released} expired seats`);
    } else {
      console.log(`[Job] No seats needed release (already released, booked, or hold extended)`);
    }
  },
  { connection: redis }
);

holdExpiryWorker.on('failed', (job, err) => {
  console.error(`[Job] hold-expiry ${job?.id} failed:`, err);
});
