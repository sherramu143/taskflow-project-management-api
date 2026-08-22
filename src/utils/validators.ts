import { z } from 'zod';
import { Status, Priority } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
  orgName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  orgId: z.string().uuid().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().optional().or(z.string().nullable()),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().optional().or(z.string().nullable()),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
});

export const bulkStatusSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one taskId is required'),
  status: z.nativeEnum(Status),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
});
