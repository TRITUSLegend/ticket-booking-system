import { Request, Response, NextFunction } from 'express';
import * as showsService from './shows.service';
import { AuthenticatedRequest } from '../../types';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const show = await showsService.createShow(req.body, req.user.userId);
    res.status(201).json({ status: 'success', data: show });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const show = await showsService.getShowById((req.params.id as string));
    res.status(200).json({ status: 'success', data: show });
  } catch (error) {
    next(error);
  }
}

export async function getByEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const shows = await showsService.getShowsByEvent((req.params.eventId as string));
    res.status(200).json({ status: 'success', data: shows });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await showsService.deleteShow(req.params.id, req.user.userId);
    res.status(200).json({ status: 'success', message: 'Show deleted successfully' });
  } catch (error) {
    next(error);
  }
}
