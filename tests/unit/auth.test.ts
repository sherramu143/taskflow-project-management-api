import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../src/utils/tokens';

describe('Unit Test: Authentication Logic', () => {
  it('should hash passwords using bcrypt cost factor >= 12', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toEqual(rawPassword);
    expect(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$')).toBe(true);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should generate and verify valid JWT access tokens', () => {
    const payload = {
      userId: 'user-uuid-123',
      orgId: 'org-uuid-456',
      role: 'org_admin',
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.orgId).toBe(payload.orgId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should generate crypto-secure refresh tokens and hashes', () => {
    const { token, hash, expiresAt } = generateRefreshToken();
    expect(token).toBeDefined();
    expect(hash).toBeDefined();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const computedHash = hashRefreshToken(token);
    expect(computedHash).toEqual(hash);
  });
});
