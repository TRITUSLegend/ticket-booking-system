import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from './api-error';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware that verifies JWT access token from Authorization header.
 * Attaches decoded user payload to req.user on success.
 * Returns 401 for missing, malformed, or expired tokens.
 */
export function authGuard(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or malformed authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
}
