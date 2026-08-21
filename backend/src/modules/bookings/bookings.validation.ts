import { z } from 'zod';

export const checkoutSchema = z.object({
  showId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
