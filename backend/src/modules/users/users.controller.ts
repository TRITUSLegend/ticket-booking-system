import { Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { AuthenticatedRequest } from '../../types';

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const profile = await usersService.getUserProfile(req.user.userId);
    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
}
