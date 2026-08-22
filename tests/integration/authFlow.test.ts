import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/prisma/client';

describe('Integration Test: Authentication Flow', () => {
  const testEmail = `test-user-${Date.now()}@example.com`;
  const password = 'Password123!';
  let refreshToken: string;

  afterAll(async () => {
    // Cleanup created test user
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should register a new user and organization', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: testEmail,
        password,
        name: 'Integration Test User',
        orgName: 'Test Org Flow',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
    refreshToken = res.body.tokens.refreshToken;
  });

  it('should login the user with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password,
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it('should fail login with invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should refresh access token using refresh token rotation', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({
        refreshToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toEqual(refreshToken); // Token rotated
  });
});
