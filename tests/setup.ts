import { prisma } from '../src/prisma/client';
import { redisConnection } from '../src/queues/emailQueue';

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (err) {
    // If DB is offline during unit testing, suppress connection error for unit tests
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {}

  try {
    await redisConnection.quit();
  } catch (err) {}
});
