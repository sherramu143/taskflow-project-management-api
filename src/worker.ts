import { Worker, Job } from 'bullmq';
import { redisConnection, EMAIL_QUEUE_NAME, TaskAssignmentEmailJobData } from './queues/emailQueue';

console.log(`Email notification worker listening on queue: ${EMAIL_QUEUE_NAME}`);

async function sendMockEmail(data: TaskAssignmentEmailJobData): Promise<void> {
  console.log(`[Email Dispatch] To: ${data.userName} <${data.userEmail}> | Task: "${data.taskTitle}" (ID: ${data.taskId})`);
}

export const emailWorker = new Worker<TaskAssignmentEmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<TaskAssignmentEmailJobData>) => {
    console.log(`Processing assignment email job ${job.id} (attempt ${job.attemptsMade + 1})`);
    await sendMockEmail(job.data);
    return { delivered: true, recipient: job.data.userEmail };
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60000,
    },
  }
);

emailWorker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job: Job | undefined, err: Error) => {
  if (job) {
    console.error(`Job ${job.id} failed: ${err.message}`);
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      console.error(`Job ${job.id} moved to dead-letter queue after max retries.`);
    }
  }
});

process.on('SIGINT', async () => {
  await emailWorker.close();
  process.exit(0);
});
