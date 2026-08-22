import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';

export class JobController {
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const jobStatus = await JobService.getJobStatus(id);
      res.status(200).json(jobStatus);
    } catch (error) {
      next(error);
    }
  }
}
