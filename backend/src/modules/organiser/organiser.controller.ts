import { Response, NextFunction } from 'express';
import * as organiserService from './organiser.service';
import { AuthenticatedRequest } from '../../types';

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await organiserService.getOrganiserDashboard(req.user.userId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

export async function getEventSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await organiserService.getEventSummary((req.params.id as string), req.user.userId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}
