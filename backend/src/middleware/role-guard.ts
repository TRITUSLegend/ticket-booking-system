import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from './api-error';
import { AuthenticatedRequest } from '../types';

/**
 * Factory that returns middleware restricting access to specified roles.
 * Must be used after authGuard so req.user is available.
 */
export function roleGuard(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden(`This action requires one of: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}
