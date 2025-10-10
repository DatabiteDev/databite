import {
  SchedulerAdapter,
  ScheduledJob,
  SyncJobData,
  ExecutionResult,
} from "../types";
import { SyncEngine } from "../engine";
import { Queue, Worker, QueueEvents } from "bullmq";

/**
 * BullMQ adapter - requires 'bullmq' and 'ioredis' as peer dependencies
 * Import this only if you want to use BullMQ
 */
export class BullMQAdapter implements SchedulerAdapter {
  private Queue: any;
  private Worker: any;
  private QueueEvents: any;
  private queue: any;
  private worker: any;
  private queueEvents: any;
  private engine: SyncEngine | null = null;

  constructor(
    private config: {
      redis?: any;
      concurrency?: number;
      removeOnComplete?: number | boolean;
      removeOnFail?: number | boolean;
    } = {}
  ) {}

  setSyncEngine(engine: SyncEngine): void {
    this.engine = engine;
  }

  async initialize(): Promise<void> {
    try {
      this.Queue = Queue;
      this.Worker = Worker;
      this.QueueEvents = QueueEvents;
    } catch (error) {
      throw new Error("BullMQ not installed. Run: npm install bullmq ioredis");
    }

    const redisConnection = this.config.redis ?? {
      host: "localhost",
      port: 6379,
    };

    this.queue = new this.Queue("sync-jobs", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: this.config.removeOnComplete ?? 100,
        removeOnFail: this.config.removeOnFail ?? 1000,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    });

    this.worker = new this.Worker(
      "sync-jobs",
      async (job: any) => {
        if (!this.engine) {
          throw new Error("SyncEngine not set");
        }
        return this.engine.executeSyncJob(job.data);
      },
      {
        connection: redisConnection,
        concurrency: this.config.concurrency ?? 5,
      }
    );

    this.queueEvents = new this.QueueEvents("sync-jobs", {
      connection: redisConnection,
    });

    this.setupEventListeners();
    console.log("BullMQAdapter initialized");
  }

  private setupEventListeners(): void {
    this.worker.on("completed", (job: any, result: any) => {
      console.log(
        `✓ Sync '${job.data.syncName}' completed in ${result.executionTime}ms`
      );
    });

    this.worker.on("failed", (job: any, err: any) => {
      console.error(`✗ Sync '${job?.data.syncName}' failed:`, err.message);
    });
  }

  async scheduleJob(
    jobId: string,
    syncName: string,
    data: SyncJobData,
    schedule: number
  ): Promise<void> {
    await this.queue.add(syncName, data, {
      jobId,
      repeat: { pattern: this.convertScheduleToCron(schedule) },
    });
  }

  async unscheduleJob(jobId: string): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const job = repeatableJobs.find((j: any) => j.id === jobId);
    if (job) {
      await this.queue.removeRepeatableByKey(job.key);
    }
  }

  async unscheduleConnectionJobs(connectionId: string): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.id?.startsWith(`${connectionId}-`)) {
        await this.queue.removeRepeatableByKey(job.key);
      }
    }
  }

  async executeNow(
    syncName: string,
    data: SyncJobData
  ): Promise<ExecutionResult> {
    const job = await this.queue.add(syncName, data, { priority: 1 });
    return job.waitUntilFinished(this.queueEvents);
  }

  async getJobs(): Promise<ScheduledJob[]> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    return repeatableJobs.map((job: any) => ({
      id: job.id || job.key,
      connectionId: job.id?.split("-")[0] || "",
      syncName: job.name,
      schedule: this.convertCronToMinutes(job.pattern || ""),
      nextRun: job.next ? new Date(job.next) : undefined,
      isActive: true,
    }));
  }

  async getJobsForConnection(connectionId: string): Promise<ScheduledJob[]> {
    const allJobs = await this.getJobs();
    return allJobs.filter((job) => job.connectionId === connectionId);
  }

  async destroy(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.queueEvents.close();
  }

  private convertScheduleToCron(schedule: number): string {
    // Convert minutes to cron expression
    // For minutes < 60, run every N minutes
    if (schedule < 60) {
      return `*/${schedule} * * * *`;
    }

    // For hours (60+ minutes), convert to hours
    const hours = Math.floor(schedule / 60);
    if (hours < 24) {
      return `0 */${hours} * * *`;
    }

    // For days (24+ hours), convert to days
    const days = Math.floor(hours / 24);
    return `0 0 */${days} * *`;
  }

  private convertCronToMinutes(cronPattern: string): number {
    // Convert cron pattern back to minutes
    const parts = cronPattern.split(" ");
    if (parts.length !== 5) return 60; // Default to 1 hour if invalid

    const [minute, hour, day] = parts;

    // Handle minute patterns like "*/15" or "0"
    if (minute.startsWith("*/")) {
      const minutes = parseInt(minute.substring(2));
      return minutes;
    }

    // Handle hour patterns like "0 */2"
    if (minute === "0" && hour.startsWith("*/")) {
      const hours = parseInt(hour.substring(2));
      return hours * 60;
    }

    // Handle day patterns like "0 0 */1"
    if (minute === "0" && hour === "0" && day.startsWith("*/")) {
      const days = parseInt(day.substring(2));
      return days * 24 * 60;
    }

    return 60; // Default to 1 hour
  }
}
