import { z } from 'zod';
import { EventType, LayoutShape } from '@prisma/client';

export const createVenueSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  supportedEventTypes: z.array(z.nativeEnum(EventType)).min(1),
  layout: z.object({
    rows: z.number().int().min(1).max(50),
    columns: z.number().int().min(1).max(50),
    shape: z.nativeEnum(LayoutShape).default(LayoutShape.RECTANGULAR),
  }),
  categoryAssignments: z.array(z.object({
    startRow: z.number().int().min(1),
    endRow: z.number().int().min(1),
    category: z.string().min(1),
  })).min(1),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;

export const updateVenueCategoriesSchema = z.object({
  categoryAssignments: z.array(z.object({
    startRow: z.number().int().min(1),
    endRow: z.number().int().min(1),
    category: z.string().min(1),
  })).min(1),
});

export type UpdateVenueCategoriesInput = z.infer<typeof updateVenueCategoriesSchema>;
