import { Role } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T = unknown> {
  status: 'success';
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
