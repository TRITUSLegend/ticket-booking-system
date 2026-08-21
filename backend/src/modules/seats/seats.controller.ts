import { Request, Response, NextFunction } from 'express';
import * as seatsService from './seats.service';
import { AuthenticatedRequest } from '../../types';

export async function getShowSeats(req: Request, res: Response, next: NextFunction) {
  try {
    const seats = await seatsService.getShowSeats((req.params.showId as string));
    res.status(200).json({ status: 'success', data: seats });
  } catch (error) {
    next(error);
  }
}

export async function holdSeats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { showId, seatIds } = req.body;
    const result = await seatsService.holdSeats(showId, seatIds, req.user.userId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function releaseSeats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { showId, seatIds } = req.body;
    const result = await seatsService.releaseSeats(showId, seatIds, req.user.userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}
