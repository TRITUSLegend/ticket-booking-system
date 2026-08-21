import { z } from 'zod';
import { SeatCategory } from '@prisma/client';

export const joinWaitlistSchema = z.object({
  showId: z.string().uuid(),
  category: z.nativeEnum(SeatCategory),
});

export const completeOfferSchema = z.object({
  token: z.string(),
});
