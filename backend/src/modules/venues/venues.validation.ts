import { z } from 'zod';
import { SeatCategory } from '@prisma/client';

export const createVenueSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  layout: z.object({
    rows: z.number().int().min(1).max(50),
    columns: z.number().int().min(1).max(50),
  }),
  categoryAssignments: z.array(z.object({
    startRow: z.number().int().min(1),
    endRow: z.number().int().min(1),
    category: z.nativeEnum(SeatCategory),
  })).min(1),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
