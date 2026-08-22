import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API Documentation',
      version: '1.0.0',
      description:
        'Multi-tenant Project Management REST API with RBAC, PostgreSQL, and BullMQ Background Email Queue.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Task not found' },
            code: { type: 'string', example: 'TASK_NOT_FOUND' },
            details: { type: 'object', example: {} },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', example: 'dev@acme.com' },
            password: { type: 'string', example: 'Password123!' },
            name: { type: 'string', example: 'John Developer' },
            orgName: { type: 'string', example: 'Acme Corp' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@acme.com' },
            password: { type: 'string', example: 'Password123!' },
            orgId: { type: 'string', example: '11111111-1111-1111-1111-111111111111' },
          },
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Mobile App Redesign' },
            description: { type: 'string', example: 'Next-gen iOS & Android apps' },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Implement Authentication' },
            description: { type: 'string', example: 'JWT auth with refresh token rotation' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-09-01T12:00:00.000Z' },
          },
        },
        AssignTaskRequest: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', example: '22222222-2222-2222-2222-222222222222' },
          },
        },
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Please review the JWT expiration settings.' },
          },
        },
        BulkStatusRequest: {
          type: 'object',
          required: ['taskIds', 'status'],
          properties: {
            taskIds: {
              type: 'array',
              items: { type: 'string' },
              example: ['task-uuid-1', 'task-uuid-2'],
            },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], example: 'done' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register new user & create organization',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: 'User registered successfully' },
            409: { description: 'User already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login user & obtain JWT tokens',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Refresh access token with rotation',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Tokens refreshed' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/projects': {
        get: {
          summary: 'List projects in organization',
          tags: ['Projects'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of projects' } },
        },
        post: {
          summary: 'Create a new project',
          tags: ['Projects'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProjectRequest' } } },
          },
          responses: { 201: { description: 'Project created' } },
        },
      },
      '/projects/{id}': {
        get: {
          summary: 'Get project details',
          tags: ['Projects'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Project details' }, 403: { description: 'Cross-tenant forbidden' } },
        },
        delete: {
          summary: 'Soft delete project (Org Admin only)',
          tags: ['Projects'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Project deleted' }, 403: { description: 'Forbidden' } },
        },
      },
      '/projects/{id}/dashboard': {
        get: {
          summary: 'Get project dashboard task status counts',
          tags: ['Projects'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Project dashboard metrics' } },
        },
      },
      '/tasks': {
        get: {
          summary: 'List tasks with filters & pagination',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'projectId', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'assigneeId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Filtered tasks' } },
        },
      },
      '/tasks/{id}/assign': {
        post: {
          summary: 'Assign user to task & trigger background email notification',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignTaskRequest' } } },
          },
          responses: { 200: { description: 'User assigned and email job enqueued' } },
        },
      },
      '/tasks/{id}/comments': {
        get: {
          summary: 'Get all comments for a task',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'List of task comments' } },
        },
        post: {
          summary: 'Add a new comment to a task',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCommentRequest' } } },
          },
          responses: { 201: { description: 'Comment created' } },
        },
      },
      '/jobs/{id}': {
        get: {
          summary: 'Get background job status & metadata',
          tags: ['Background Jobs'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Job status details' }, 404: { description: 'Job not found' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
