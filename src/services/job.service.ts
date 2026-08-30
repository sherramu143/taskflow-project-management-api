import { emailQueue, ensureRedisConnection } from '../queues/emailQueue';
import { NotFoundError, AppError } from '../utils/errors';

export class JobService {
  static async getJobStatus(jobId: string) {
    try {
      await ensureRedisConnection();
      const job = await emailQueue.getJob(jobId);

      if (!job) {
        throw new NotFoundError(`Job with ID ${jobId} not found`, 'JOB_NOT_FOUND');
      }

      const state = await job.getState();

      // Map BullMQ states to supported statuses: pending, active, completed, failed
      let mappedStatus: 'pending' | 'active' | 'completed' | 'failed' = 'pending';

      if (state === 'completed') {
        mappedStatus = 'completed';
      } else if (state === 'failed') {
        mappedStatus = 'failed';
      } else if (state === 'active') {
        mappedStatus = 'active';
      } else {
        mappedStatus = 'pending';
      }

      return {
        id: job.id,
        name: job.name,
        status: mappedStatus,
        rawState: state,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn || null,
        finishedOn: job.finishedOn || null,
        failedReason: job.failedReason || null,
        data: job.data,
        returnvalue: job.returnvalue || null,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Job service unavailable: ${err.message || 'Unable to connect to Redis background queue'}`,
        500,
        'QUEUE_CONNECTION_ERROR',
        { originalError: err.message }
      );
    }
  }
}


