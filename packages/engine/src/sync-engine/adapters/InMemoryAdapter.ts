import {
  SchedulerAdapter,
  ScheduledJob,
  SyncJobData,
  ExecutionResult,
} from "../types";
import { SyncEngine } from "../engine";

/**
 * InMemoryAdapter - a simple adapter that runs the sync engine in memory
 * No dependencies, no external services
 */
export class InMemoryAdapter implements SchedulerAdapter {
  private jobs = new Map<string, ScheduledJob>();
  private timers = new Map<string, NodeJS.Timeout>();
  private engine: SyncEngine | null = null;

  constructor(syncEngine?: SyncEngine) {
    this.engine = syncEngine || null;
  }

  setSyncEngine(engine: SyncEngine): void {
    this.engine = engine;
  }

  async initialize(): Promise<void> {
    console.log("InMemoryAdapter initialized");
  }

  async scheduleJob(
    jobId: string,
    syncName: string,
    data: SyncJobData,
    schedule: number
  ): Promise<void> {
    const nextRun = this.calculateNextRun(schedule);

    const job: ScheduledJob = {
      id: jobId,
      connectionId: data.connectionId,
      syncName,
      schedule,
      nextRun,
      isActive: true,
    };

    this.jobs.set(jobId, job);
    this.scheduleNextRun(job);
  }

  private scheduleNextRun(job: ScheduledJob): void {
    if (!job.isActive || !job.nextRun) return;

    const delay = job.nextRun.getTime() - Date.now();
    if (delay < 0) {
      job.nextRun = this.calculateNextRun(job.schedule);
      return this.scheduleNextRun(job);
    }

    const timer = setTimeout(async () => {
      await this.executeJob(job);
      job.nextRun = this.calculateNextRun(job.schedule);
      this.scheduleNextRun(job);
    }, delay);

    this.timers.set(job.id, timer);
  }

  private async executeJob(job: ScheduledJob): Promise<void> {
    if (!this.engine) return;

    try {
      const result = await this.engine.executeSyncJob({
        connectionId: job.connectionId,
        syncName: job.syncName,
      });

      job.lastRun = new Date();
      job.lastResult = result;
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error);
    }
  }

  async unscheduleJob(jobId: string): Promise<void> {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
    this.jobs.delete(jobId);
  }

  async unscheduleConnectionJobs(connectionId: string): Promise<void> {
    const jobIds = Array.from(this.jobs.values())
      .filter((job) => job.connectionId === connectionId)
      .map((job) => job.id);

    for (const jobId of jobIds) {
      await this.unscheduleJob(jobId);
    }
  }

  async executeNow(
    _syncName: string,
    data: SyncJobData
  ): Promise<ExecutionResult> {
    if (!this.engine) {
      throw new Error("SyncEngine not set on adapter");
    }
    return this.engine.executeSyncJob(data);
  }

  async getJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.jobs.values());
  }

  async getJobsForConnection(connectionId: string): Promise<ScheduledJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.connectionId === connectionId
    );
  }

  async destroy(): Promise<void> {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.jobs.clear();
  }

  private calculateNextRun(schedule: number): Date {
    const now = new Date();
    // Schedule is in minutes, convert to milliseconds
    return new Date(now.getTime() + schedule * 60 * 1000);
  }
}
