import { Request, Response, NextFunction } from 'express';
import * as eventsService from './events.service';
import { AuthenticatedRequest } from '../../types';
import { EventType } from '@prisma/client';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.createEvent(req.body, req.user.userId);
    res.status(201).json({ status: 'success', data: event });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, search } = req.query;
    const filters: { type?: EventType; search?: string } = {};
    if (type && Object.values(EventType).includes(type as EventType)) {
      filters.type = type as EventType;
    }
    if (search && typeof search === 'string') {
      filters.search = search;
    }

    const events = await eventsService.getEvents(filters);
    res.status(200).json({ status: 'success', data: events });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.getEventById((req.params.id as string));
    res.status(200).json({ status: 'success', data: event });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await eventsService.deleteEvent(req.params.id as string, req.user.userId);
    res.status(200).json({ status: 'success', message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}
