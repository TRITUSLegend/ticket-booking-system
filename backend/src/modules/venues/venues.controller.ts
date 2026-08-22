import { Request, Response, NextFunction } from 'express';
import * as venuesService from './venues.service';
import { AuthenticatedRequest } from '../../types';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await venuesService.createVenue(req.body, req.user.userId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const eventType = req.query.eventType as string | undefined;
    const venues = await venuesService.getVenues(eventType);
    res.json({ status: 'success', data: venues });
  } catch (error) {
    next(error);
  }
};

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const venue = await venuesService.getVenueById((req.params.id as string));
    res.status(200).json({ status: 'success', data: venue });
  } catch (error) {
    next(error);
  }
}
