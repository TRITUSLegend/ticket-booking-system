import { Worker } from 'bullmq';
import { redis } from '../config';
import { expireOffer } from '../modules/waitlist/waitlist.service';

export const offerExpiryWorker = new Worker(
  'offer-expiry',
  async (job) => {
    const { waitlistId } = job.data;
    console.log(`[Job] Executing offer-expiry for waitlist ${waitlistId}`);

    // Call the service to expire the offer and cascade to next in waitlist
    await expireOffer(waitlistId);
  },
  { connection: redis }
);

offerExpiryWorker.on('failed', (job, err) => {
  console.error(`[Job] offer-expiry ${job?.id} failed:`, err);
});
