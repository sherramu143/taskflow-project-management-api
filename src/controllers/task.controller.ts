import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { TaskService } from '../services/task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  bulkStatusSchema,
  createCommentSchema,
} from '../utils/validators';
import { Status, Priority } from '@prisma/client';

function getSingleParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class TaskController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = getSingleParam(req.params.projectId);
      const validated = createTaskSchema.parse(req.body);
      const task = await TaskService.createTask(req.orgId!, projectId, validated);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        projectId,
        status,
        priority,
        assigneeId,
        dueDateFrom,
        dueDateTo,
        search,
        page,
        limit,
        cursor,
      } = req.query;

      const paginationType = cursor ? 'cursor' : 'offset';

      const result = await TaskService.getTasks(req.orgId!, {
        projectId: projectId ? String(projectId) : undefined,
        status: status ? (String(status) as Status) : undefined,
        priority: priority ? (String(priority) as Priority) : undefined,
        assigneeId: assigneeId ? String(assigneeId) : undefined,
        dueDateFrom: dueDateFrom ? String(dueDateFrom) : undefined,
        dueDateTo: dueDateTo ? String(dueDateTo) : undefined,
        search: search ? String(search) : undefined,
        page,
        limit,
        cursor: cursor ? String(cursor) : undefined,
        paginationType,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const task = await TaskService.getTaskById(req.orgId!, id);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const validated = updateTaskSchema.parse(req.body);
      const updated = await TaskService.updateTask(req.orgId!, id, validated);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      await TaskService.deleteTask(req.orgId!, id);
      res.status(200).json({ message: 'Task soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async bulkStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = bulkStatusSchema.parse(req.body);
      const result = await TaskService.bulkUpdateStatus(req.orgId!, validated.taskIds, validated.status);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const validated = assignTaskSchema.parse(req.body);
      const result = await TaskService.assignUserToTask(
        req.orgId!,
        id,
        validated.userId,
        req.user!.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async unassign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = getSingleParam(req.params.id);
      const userId = getSingleParam(req.params.userId);
      const result = await TaskService.unassignUserFromTask(req.orgId!, taskId, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const validated = createCommentSchema.parse(req.body);
      const comment = await TaskService.addComment(req.orgId!, id, req.user!.id, validated.content);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const comments = await TaskService.getTaskComments(req.orgId!, id);
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }
}
