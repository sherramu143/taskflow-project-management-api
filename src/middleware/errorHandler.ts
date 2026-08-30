import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'A resource with that unique constraint already exists',
        code: 'CONFLICT',
        details: { target: err.meta?.target },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Requested record not found',
        code: 'NOT_FOUND',
        details: { message: err.message },
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(500).json({
      error: 'Database connection failure. Check DATABASE_URL environment variable.',
      code: 'DATABASE_CONNECTION_ERROR',
      details: { message: err.message },
    });
    return;
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    details: { message: err.message || 'An unexpected server error occurred' },
  });
}

