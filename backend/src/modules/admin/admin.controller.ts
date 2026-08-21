import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
}
