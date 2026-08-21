import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { CreateEventInput } from './events.validation';
import { EventType, Prisma } from '@prisma/client';

export async function createEvent(data: CreateEventInput, organiserId: string) {
  return prisma.event.create({
    data: {
      ...data,
      organiserId,
    },
  });
}

export async function getEvents(filters?: { type?: EventType; search?: string }) {
  const where: Prisma.EventWhereInput = {};
  
  if (filters?.type) {
    where.type = filters.type;
  }
  
  if (filters?.search) {
    where.title = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  return prisma.event.findMany({
    where,
    include: {
      _count: {
        select: { shows: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organiser: {
        select: { name: true },
      },
      shows: {
        include: {
          venue: {
            select: { name: true, address: true },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  return event;
}
