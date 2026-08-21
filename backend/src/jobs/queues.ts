import { Queue } from 'bullmq';
import { redis } from '../config';

export const holdExpiryQueue = new Queue('hold-expiry', {
  connection: redis,
});

export const offerExpiryQueue = new Queue('offer-expiry', {
  connection: redis,
});

export async function scheduleHoldExpiry(
  showId: string,
  seatIds: string[],
  userId: string,
  delayMs: number
) {
  await holdExpiryQueue.add(
    'expire-holds',
    { showId, seatIds, userId },
    { delay: delayMs, removeOnComplete: true, removeOnFail: false }
  );
}

export async function scheduleOfferExpiry(
  waitlistId: string,
  delayMs: number
) {
  await offerExpiryQueue.add(
    'expire-offer',
    { waitlistId },
    { delay: delayMs, removeOnComplete: true, removeOnFail: false }
  );
}
