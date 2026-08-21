import { z } from 'zod';

export const holdSeatsSchema = z.object({
  showId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(10),
});

export const releaseSeatsSchema = z.object({
  showId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
});

export const getShowSeatsParamsSchema = z.object({
  showId: z.string().uuid(),
});

export type HoldSeatsInput = z.infer<typeof holdSeatsSchema>;
export type ReleaseSeatsInput = z.infer<typeof releaseSeatsSchema>;
