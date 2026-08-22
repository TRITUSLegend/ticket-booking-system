import { z } from 'zod';

export const createShowSchema = z.object({
  eventId: z.string().uuid(),
  venueId: z.string().uuid(),
  date: z.string().datetime(), // ISO datetime string
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:mm format'),
  pricing: z.array(z.object({
    category: z.string().min(1),
    price: z.number().positive(),
  })).min(1),
});

export type CreateShowInput = z.infer<typeof createShowSchema>;
