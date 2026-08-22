import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProjectService } from '../services/project.service';
import { createProjectSchema, updateProjectSchema } from '../utils/validators';

function getSingleParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class ProjectController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createProjectSchema.parse(req.body);
      const project = await ProjectService.createProject(req.orgId!, validated);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cursor, page, limit } = req.query;

      if (cursor) {
        const result = await ProjectService.getProjectsCursor(req.orgId!, String(cursor), limit);
        res.status(200).json(result);
      } else {
        const result = await ProjectService.getProjectsOffset(req.orgId!, page, limit);
        res.status(200).json(result);
      }
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const project = await ProjectService.getProjectById(req.orgId!, id);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const validated = updateProjectSchema.parse(req.body);
      const updated = await ProjectService.updateProject(req.orgId!, id, validated);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      await ProjectService.deleteProject(req.orgId!, id);
      res.status(200).json({ message: 'Project soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getSingleParam(req.params.id);
      const dashboard = await ProjectService.getProjectDashboard(req.orgId!, id);
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}
