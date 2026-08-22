import { prisma } from '../prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import {
  parseOffsetParams,
  buildOffsetResponse,
  buildCursorResponse,
  OffsetPaginationResult,
  CursorPaginationResult,
} from '../utils/pagination';

export class ProjectService {
  static async createProject(orgId: string, data: { name: string; description?: string }) {
    return prisma.project.create({
      data: {
        orgId,
        name: data.name,
        description: data.description,
      },
    });
  }

  static async getProjectsOffset(
    orgId: string,
    queryPage?: any,
    queryLimit?: any
  ): Promise<OffsetPaginationResult<any>> {
    const { page, limit, skip } = parseOffsetParams(queryPage, queryLimit);

    const where = {
      orgId,
      deletedAt: null,
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return buildOffsetResponse(projects, total, page, limit);
  }

  static async getProjectsCursor(
    orgId: string,
    cursor?: string,
    queryLimit?: any
  ): Promise<CursorPaginationResult<any>> {
    const limit = Math.min(100, Math.max(1, parseInt(String(queryLimit || '20'), 10) || 20));

    const projects = await prisma.project.findMany({
      where: {
        orgId,
        deletedAt: null,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { id: 'asc' },
    });

    return buildCursorResponse(projects, limit);
  }

  static async getProjectById(orgId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found', 'PROJECT_NOT_FOUND');
    }

    // Cross-tenant verification: enforce org_id match
    if (project.orgId !== orgId) {
      throw new ForbiddenError('Access to project in another organization is forbidden', 'CROSS_TENANT_FORBIDDEN');
    }

    return project;
  }

  static async updateProject(orgId: string, projectId: string, data: { name?: string; description?: string }) {
    await this.getProjectById(orgId, projectId);

    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  static async deleteProject(orgId: string, projectId: string) {
    await this.getProjectById(orgId, projectId);

    // Soft delete project and soft delete associated tasks
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.task.updateMany({
        where: { projectId, orgId, deletedAt: null },
        data: { deletedAt: now },
      });

      return tx.project.update({
        where: { id: projectId },
        data: { deletedAt: now },
      });
    });
  }

  static async getProjectDashboard(orgId: string, projectId: string) {
    await this.getProjectById(orgId, projectId);

    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
        orgId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const statusMap: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    taskCounts.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return {
      projectId,
      totalTasks,
      statusCounts: statusMap,
    };
  }
}
