import { Connection, Connector, Integration } from "@databite/types";
import { IntegrationRateLimiter } from "../rate-limiter/rate-limiter";
import { SyncEngine } from "./engine";

/**
 * Represents the result of executing a sync operation.
 */
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

/**
 * Represents a scheduled job for a connector connection's sync operation.
 */
export interface ScheduledJob {
  id: string;
  connectionId: string;
  syncName: string;
  schedule: number; // Number of minutes between syncs
  nextRun?: Date;
  isActive: boolean;
  lastRun?: Date;
  lastResult?: ExecutionResult;
}

/**
 * Job data structure for scheduler adapters
 */
export interface SyncJobData {
  connectionId: string;
  syncName: string;
}

/**
 * Interface that all scheduler adapters must implement
 */
export interface SchedulerAdapter {
  /**
   * Set the sync engine
   */
  setSyncEngine(engine: SyncEngine): void;

  /**
   * Initialize the adapter
   */
  initialize(): Promise<void>;

  /**
   * Schedule a recurring job
   */
  scheduleJob(
    jobId: string,
    syncName: string,
    data: SyncJobData,
    schedule: number
  ): Promise<void>;

  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string): Promise<void>;

  /**
   * Unschedule all jobs for a connection
   */
  unscheduleConnectionJobs(connectionId: string): Promise<void>;

  /**
   * Execute a job immediately (one-time)
   */
  executeNow(syncName: string, data: SyncJobData): Promise<ExecutionResult>;

  /**
   * Get all scheduled jobs
   */
  getJobs(): Promise<ScheduledJob[]>;

  /**
   * Get jobs for a specific connection
   */
  getJobsForConnection(connectionId: string): Promise<ScheduledJob[]>;

  /**
   * Clean up and close the adapter
   */
  destroy(): Promise<void>;
}

/**
 * Configuration options for the SyncEngine
 */
export interface SyncEngineConfig {
  adapter: SchedulerAdapter; // Required: user must provide an adapter
  getConnection: (id: string) => Connection<any> | undefined;
  getIntegration: (id: string) => Integration<any> | undefined;
  getConnector: (id: string) => Connector<any, any> | undefined;
  minutesBetweenSyncs: number; // Number of minutes between syncs
  rateLimiter: IntegrationRateLimiter;
}
