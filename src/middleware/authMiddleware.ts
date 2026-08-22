import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/tokens';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  orgId?: string;
  role?: string;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header token', 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    let payload: TokenPayload;

    try {
      payload = verifyAccessToken(token);
    } catch (jwtErr) {
      throw new UnauthorizedError('Invalid or expired access token', 'TOKEN_EXPIRED');
    }

    // Verify membership in database to enforce active membership status & role
    const member = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: payload.orgId,
          userId: payload.userId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new ForbiddenError('User is not a member of the target organization', 'CROSS_TENANT_FORBIDDEN');
    }

    req.user = {
      id: member.user.id,
      email: member.user.email,
      name: member.user.name,
    };
    req.orgId = member.orgId;
    req.role = member.role;

    next();
  } catch (error) {
    next(error);
  }
}
