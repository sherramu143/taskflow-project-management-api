import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  // Requirement: bcrypt cost factor >= 12
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: TokenPayload): string {
  // Read directly from process.env to avoid module-init timing issues
  const secret = process.env.JWT_SECRET || 'super-secret-access-token-key-taskflow-2026';
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  // 7 days TTL
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET || 'super-secret-access-token-key-taskflow-2026';
  return jwt.verify(token, secret) as TokenPayload;
}
