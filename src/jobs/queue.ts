import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

export const calculationQueue = new Queue('calculation', { connection });
export const pollingQueue = new Queue('polling', { connection });
