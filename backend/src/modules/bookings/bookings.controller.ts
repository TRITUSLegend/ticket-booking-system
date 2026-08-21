import { Response, NextFunction } from 'express';
import * as bookingsService from './bookings.service';
import { AuthenticatedRequest } from '../../types';

export async function checkout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await bookingsService.checkout(req.body, req.user.userId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const history = await bookingsService.getBookingHistory(req.user.userId);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await bookingsService.cancelBooking((req.params.id as string), req.user.userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}
