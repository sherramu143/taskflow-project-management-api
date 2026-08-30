import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';

export class JobController {
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (id === 'process-pending') {
        return JobController.processPending(req, res, next);
      }
      const jobStatus = await JobService.getJobStatus(id);
      res.status(200).json(jobStatus);
    } catch (error) {
      next(error);
    }
  }

  static async processPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limitParam = req.query.limit || req.body?.limit;
      const limit = limitParam ? parseInt(String(limitParam), 10) : 10;
      const result = await JobService.processPendingJobs(limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
