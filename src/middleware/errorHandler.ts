import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  // Prisma unique constraint
  if ((err as { code?: string }).code === 'P2002') {
    res.status(409).json({ success: false, error: 'Resource already exists' });
    return;
  }

  // Prisma not found
  if ((err as { code?: string }).code === 'P2025') {
    res.status(404).json({ success: false, error: 'Resource not found' });
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
}
