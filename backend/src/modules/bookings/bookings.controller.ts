import { Response, NextFunction } from 'express';
import * as bookingsService from './bookings.service';
import { AuthenticatedRequest } from '../../types';

export async function checkout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log('\n\n--- CHECKOUT REQUEST RECEIVED ---');
  console.log('User:', req.user?.userId);
  console.log('Body:', req.body);
  try {
    const result = await bookingsService.checkout(req.body, req.user.userId);
    console.log('CHECKOUT SUCCESS!');
    res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('CHECKOUT FAILED! Error type:', typeof error, error?.constructor?.name);
    console.error('Full error:', error);
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
