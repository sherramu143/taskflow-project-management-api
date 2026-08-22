import { prisma } from '../prisma/client';
import { Status, Priority } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import {
  parseOffsetParams,
  buildOffsetResponse,
  buildCursorResponse,
  OffsetPaginationResult,
  CursorPaginationResult,
} from '../utils/pagination';
import { enqueueTaskAssignmentEmail } from '../queues/emailQueue';

export interface TaskFilterOptions {
  projectId?: string;
  status?: Status;
  priority?: Priority;
  assigneeId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  page?: any;
  limit?: any;
  cursor?: string;
  paginationType?: 'offset' | 'cursor';
}

export class TaskService {
  static async createTask(
    orgId: string,
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: Status;
      priority?: Priority;
      dueDate?: string | Date | null;
    }
  ) {
    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundError('Project not found', 'PROJECT_NOT_FOUND');
    }

    if (project.orgId !== orgId) {
      throw new ForbiddenError('Project belongs to another organization', 'CROSS_TENANT_FORBIDDEN');
    }

    return prisma.task.create({
      data: {
        projectId,
        orgId,
        title: data.title,
        description: data.description,
        status: data.status || Status.todo,
        priority: data.priority || Priority.medium,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  static async getTasks(orgId: string, filters: TaskFilterOptions) {
    const where: any = {
      orgId,
      deletedAt: null,
    };

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assigneeId) {
      where.assignments = {
        some: {
          userId: filters.assigneeId,
        },
      };
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }

    // Full-Text Search or Title/Description substring search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.paginationType === 'cursor') {
      const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || '20'), 10) || 20));
      const cursor = filters.cursor;

      const tasks = await prisma.task.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: { id: 'asc' },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      return buildCursorResponse(tasks, limit);
    } else {
      // Offset pagination (Default)
      const { page, limit, skip } = parseOffsetParams(filters.page, filters.limit);

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            assignments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        }),
        prisma.task.count({ where }),
      ]);

      return buildOffsetResponse(tasks, total, page, limit);
    }
  }

  static async getTaskById(orgId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.orgId !== orgId) {
      throw new ForbiddenError('Task belongs to another organization', 'CROSS_TENANT_FORBIDDEN');
    }

    return task;
  }

  static async updateTask(
    orgId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: Status;
      priority?: Priority;
      dueDate?: string | Date | null;
    }
  ) {
    await this.getTaskById(orgId, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
    });
  }

  static async deleteTask(orgId: string, taskId: string) {
    await this.getTaskById(orgId, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  static async bulkUpdateStatus(orgId: string, taskIds: string[], status: Status) {
    if (!taskIds || !taskIds.length) {
      throw new ValidationError('taskIds array must not be empty');
    }

    const updated = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        orgId,
        deletedAt: null,
      },
      data: { status },
    });

    return {
      updatedCount: updated.count,
      status,
    };
  }

  static async assignUserToTask(orgId: string, taskId: string, userId: string, assignedByUserId: string) {
    const task = await this.getTaskById(orgId, taskId);

    // Enforce that assigned user belongs to the same organization
    const member = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new ForbiddenError('Assigned user must belong to the same organization', 'INVALID_ASSIGNMENT_USER');
    }

    // Transactional Assignment & Async Background Queue Consistency
    const assignment = await prisma.$transaction(async (tx) => {
      const existing = await tx.taskAssignment.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      return tx.taskAssignment.create({
        data: {
          taskId,
          userId,
        },
      });
    });

    // Asynchronously enqueue background email job without blocking API response
    let jobInfo = null;
    try {
      const job = await enqueueTaskAssignmentEmail({
        assignmentId: assignment.id,
        taskId: task.id,
        taskTitle: task.title,
        userId: member.user.id,
        userEmail: member.user.email,
        userName: member.user.name,
        assignedByUserId,
        orgId,
      });

      jobInfo = {
        jobId: job.id,
        status: 'enqueued',
      };
    } catch (jobErr) {
      console.error('Failed to enqueue email job for task assignment:', jobErr);
      // Fallback strategy: Assignment is persisted cleanly in DB, log warning or save to outbox
    }

    return {
      assignment,
      job: jobInfo,
    };
  }

  static async unassignUserFromTask(orgId: string, taskId: string, userId: string) {
    await this.getTaskById(orgId, taskId);

    await prisma.taskAssignment.deleteMany({
      where: {
        taskId,
        userId,
      },
    });

    return { message: 'User unassigned successfully' };
  }

  static async addComment(orgId: string, taskId: string, authorId: string, content: string) {
    await this.getTaskById(orgId, taskId);

    if (!content || !content.trim()) {
      throw new ValidationError('Comment content cannot be empty');
    }

    return prisma.comment.create({
      data: {
        taskId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getTaskComments(orgId: string, taskId: string) {
    await this.getTaskById(orgId, taskId);

    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
