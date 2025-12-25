import { Connection, Connector, Integration } from "@databite/types";
import { RateLimiter } from "../rate-limiter/rate-limiter";

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
  syncInterval: number; // Number of minutes between syncs
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
 * Configuration options for the SyncEngine
 */
export interface SyncEngineConfig {
  getConnection: (id: string) => Promise<Connection<any> | undefined>;
  getIntegration: (id: string) => Integration<any> | undefined;
  getConnector: (id: string) => Connector<any, any> | undefined;
  updateConnectionMetadata: (
    connectionId: string,
    metadata: Record<string, any>
  ) => Promise<void>;
  rateLimiter: RateLimiter;
}
