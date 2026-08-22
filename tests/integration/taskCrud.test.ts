import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/prisma/client';

describe('Integration Test: Task & Project CRUD Flow', () => {
  let authToken: string;
  let userId: string;
  let orgId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const email = `task-crud-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'Task CRUD User',
        orgName: 'CRUD Test Org',
      });

    authToken = res.body.tokens.accessToken;
    userId = res.body.user.id;
    orgId = res.body.organization.id;
  });

  afterAll(async () => {
    if (orgId) {
      await prisma.organization.delete({ where: { id: orgId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
  });

  it('should create a project', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Task CRUD Project',
        description: 'Testing task management',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    projectId = res.body.id;
  });

  it('should create a task in the project', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Initial CRUD Task',
        description: 'Task details for integration testing',
        status: 'todo',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    taskId = res.body.id;
  });

  it('should list tasks with offset pagination and filter', async () => {
    const res = await request(app)
      .get(`/tasks?projectId=${projectId}&status=todo`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].id).toBe(taskId);
  });

  it('should assign a user to the task and trigger background queue job', async () => {
    const res = await request(app)
      .post(`/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
      });

    expect(res.status).toBe(200);
    expect(res.body.assignment).toBeDefined();
    expect(res.body.job).toBeDefined();
  });

  it('should get project dashboard metrics', async () => {
    const res = await request(app)
      .get(`/projects/${projectId}/dashboard`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(1);
    expect(res.body.statusCounts.todo).toBe(1);
  });

  it('should soft delete the task', async () => {
    const res = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('soft deleted');
  });
});
