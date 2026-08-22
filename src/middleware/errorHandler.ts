import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedDetails = err.errors.reduce((acc: Record<string, string>, curr) => {
      const field = curr.path.join('.');
      acc[field || 'request'] = curr.message;
      return acc;
    }, {});

    res.status(422).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedDetails,
    });
    return;
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? { message: err.message } : {},
  });
}
