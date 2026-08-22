import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/prisma/client';

describe('Integration Test: Cross-Tenant Isolation Enforcement', () => {
  let user1Token: string;
  let user1OrgId: string;
  let user1ProjectId: string;

  let user2Token: string;
  let user2OrgId: string;

  beforeAll(async () => {
    // 1. Register User 1 in Org Alpha
    const res1 = await request(app)
      .post('/auth/register')
      .send({
        email: `alpha-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Alpha Admin',
        orgName: 'Alpha Corp',
      });
    user1Token = res1.body.tokens.accessToken;
    user1OrgId = res1.body.organization.id;

    // Create a project in Org Alpha
    const projRes = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Alpha Secret Project' });
    user1ProjectId = projRes.body.id;

    // 2. Register User 2 in Org Beta
    const res2 = await request(app)
      .post('/auth/register')
      .send({
        email: `beta-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Beta Admin',
        orgName: 'Beta Corp',
      });
    user2Token = res2.body.tokens.accessToken;
    user2OrgId = res2.body.organization.id;
  });

  afterAll(async () => {
    if (user1OrgId) await prisma.organization.delete({ where: { id: user1OrgId } });
    if (user2OrgId) await prisma.organization.delete({ where: { id: user2OrgId } });
  });

  it('should return 403 Forbidden when User 2 from Org Beta attempts to access Org Alpha project', async () => {
    const res = await request(app)
      .get(`/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_FORBIDDEN');
  });

  it('should return 403 Forbidden when User 2 attempts to delete Org Alpha project', async () => {
    const res = await request(app)
      .delete(`/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_FORBIDDEN');
  });
});
