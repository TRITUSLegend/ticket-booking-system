import { z } from 'zod';

export const joinWaitlistSchema = z.object({
  showId: z.string().uuid(),
  category: z.string().min(1),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;

export const completeOfferSchema = z.object({
  token: z.string(),
});
