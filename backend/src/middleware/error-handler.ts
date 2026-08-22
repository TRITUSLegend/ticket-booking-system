import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from './api-error';
import { ApiErrorResponse } from '../types';

/**
 * Global error handler middleware.
 * Catches ApiError instances, Prisma client errors, and unhandled exceptions.
 * Never leaks internal implementation details (stack traces, SQL, file paths) to clients.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Known application errors — safe to forward to client
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

  // Prisma known request errors (constraint violations, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('Prisma error:', err.code, err.message);

    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'A record with this data already exists.',
        code: 'CONFLICT',
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'The requested record was not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'A database error occurred. Please try again later.',
      code: 'DATABASE_ERROR',
    });
    return;
  }

  // Prisma validation errors (invalid input to Prisma queries)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma validation error:', err.message);
    res.status(400).json({
      status: 'error',
      message: 'Invalid data provided.',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Catch-all for any unhandled errors — never expose internals
  console.error('Unhandled error:', err);

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_ERROR',
  });
};
