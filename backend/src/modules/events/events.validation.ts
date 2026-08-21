import { z } from 'zod';
import { EventType } from '@prisma/client';

export const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  type: z.nativeEnum(EventType),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
