import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { ApiError } from '../../middleware';
import { AuthenticatedRequest } from '../../types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('Refresh token missing');
    }

    const result = await authService.refreshTokens(token);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      status: 'success',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    // Clear cookie on failure
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    next(error);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user.userId);
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
}
