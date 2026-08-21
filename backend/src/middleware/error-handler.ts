import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from './api-error';
import { ApiErrorResponse } from '../types';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    const response: ApiErrorResponse = {
      status: 'error',
      message: err.message,
      code: err.code,
    };

    if (err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  console.error('Unhandled error:', err);

  const response: ApiErrorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR',
  };

  res.status(500).json(response);
};
