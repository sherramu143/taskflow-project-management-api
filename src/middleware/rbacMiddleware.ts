import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.role || !allowedRoles.includes(req.role as Role)) {
      next(
        new ForbiddenError(
          `Action requires one of the following roles: [${allowedRoles.join(', ')}]`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole([Role.org_admin]);
