import { prisma } from '../prisma/client';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/tokens';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { Role } from '@prisma/client';

export class AuthService {
  static async register(data: { email: string; password: string; name: string; orgName?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists', 'USER_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(data.password);
    const orgName = data.orgName || `${data.name}'s Organization`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
        },
      });

      const member = await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId: user.id,
          role: Role.org_admin,
        },
      });

      const accessToken = generateAccessToken({
        userId: user.id,
        orgId: org.id,
        role: member.role,
      });

      const refreshData = generateRefreshToken();
      await tx.refreshToken.create({
        data: {
          tokenHash: refreshData.hash,
          userId: user.id,
          expiresAt: refreshData.expiresAt,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organization: {
          id: org.id,
          name: org.name,
          role: member.role,
        },
        tokens: {
          accessToken,
          refreshToken: refreshData.token,
        },
      };
    });
  }

  static async login(data: { email: string; password: string; orgId?: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (user.memberships.length === 0) {
      throw new UnauthorizedError('User does not belong to any organization', 'NO_ORGANIZATION');
    }

    let activeMembership = user.memberships[0];
    if (data.orgId) {
      const match = user.memberships.find((m) => m.orgId === data.orgId);
      if (!match) {
        throw new UnauthorizedError('User does not belong to the specified organization', 'INVALID_ORG_ACCESS');
      }
      activeMembership = match;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      orgId: activeMembership.orgId,
      role: activeMembership.role,
    });

    const refreshData = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshData.hash,
        userId: user.id,
        expiresAt: refreshData.expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: activeMembership.org.id,
        name: activeMembership.org.name,
        role: activeMembership.role,
      },
      tokens: {
        accessToken,
        refreshToken: refreshData.token,
      },
    };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const existingTokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (!existingTokenRecord || existingTokenRecord.revoked || existingTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid, expired, or revoked refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = existingTokenRecord.user;
    if (!user.memberships.length) {
      throw new UnauthorizedError('User has no active organization membership', 'NO_ORGANIZATION');
    }

    const primaryMembership = user.memberships[0];

    // Refresh Token Rotation: Revoke current refresh token & issue a new token pair
    await prisma.refreshToken.update({
      where: { id: existingTokenRecord.id },
      data: { revoked: true },
    });

    const newAccessToken = generateAccessToken({
      userId: user.id,
      orgId: primaryMembership.orgId,
      role: primaryMembership.role,
    });

    const newRefreshData = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshData.hash,
        userId: user.id,
        expiresAt: newRefreshData.expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshData.token,
    };
  }

  static async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  static async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}
