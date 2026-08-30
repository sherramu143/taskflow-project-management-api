import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';

const redisUrl = process.env.REDIS_URL;
const host = env && env.REDIS_HOST ? env.REDIS_HOST : 'localhost';
const port = env && env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379;
const password = env && env.REDIS_PASSWORD ? env.REDIS_PASSWORD : undefined;
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'redis';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
};

export const redisConnection = redisUrl
  ? new Redis(redisUrl, redisOptions)
  : new Redis({
    host,
    port,
    password,
    tls: isLocal ? undefined : {},
    ...redisOptions,
  });

export async function ensureRedisConnection() {
  if ((redisConnection.status as string) === 'ready') {
    return;
  }

  if (['wait', 'end', 'close'].includes(redisConnection.status)) {
    try {
      redisConnection.disconnect();
    } catch (err) { }
    try {
      await redisConnection.connect();
    } catch (err) { }
  }

  let attempts = 0;
  while ((redisConnection.status as string) !== 'ready' && attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }
}

export const EMAIL_QUEUE_NAME = 'email-notifications';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

export interface TaskAssignmentEmailJobData {
  assignmentId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  assignedByUserId: string;
  orgId: string;
}

export async function enqueueTaskAssignmentEmail(data: TaskAssignmentEmailJobData) {
  await ensureRedisConnection();
  // Deduplicate duplicate assignment notifications within a 5-second window
  const timeBucket = Math.floor(Date.now() / 5000);
  const jobId = `assign-email-${data.taskId}-${data.userId}-${timeBucket}`;

  return emailQueue.add('task-assigned-email', data, { jobId });
}
