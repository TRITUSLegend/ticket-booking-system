import { Response, NextFunction } from 'express';
import * as waitlistService from './waitlist.service';
import { AuthenticatedRequest } from '../../types';

export async function join(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { showId, category } = req.body;
    const result = await waitlistService.joinWaitlist(showId, category, req.user.userId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function completeOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    const result = await waitlistService.completeOffer(token, req.user.userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}
