import { Connection, Connector, Integration } from "@databite/types";
import {
  SyncEngineConfig,
  ScheduledJob,
  ExecutionResult,
  SyncJobData,
} from "./types";
import { RateLimiter } from "../rate-limiter/rate-limiter";
import { Scheduler } from "./scheduler";

/**
 * Engine for scheduling and executing syncs for connector connections.
 */
export class SyncEngine {
  private scheduler: Scheduler;
  private getConnection: (id: string) => Promise<Connection<any> | undefined>;
  private getIntegration: (id: string) => Integration<any> | undefined;
  private getConnector: (id: string) => Connector<any, any> | undefined;
  private updateConnectionMetadata: (
    connectionId: string,
    metadata: Record<string, any>
  ) => Promise<void>;
  private rateLimiter: RateLimiter;

  constructor(config: SyncEngineConfig) {
    this.getConnection = config.getConnection;
    this.getIntegration = config.getIntegration;
    this.getConnector = config.getConnector;
    this.updateConnectionMetadata = config.updateConnectionMetadata;
    this.rateLimiter = config.rateLimiter || new RateLimiter();
    this.scheduler = new Scheduler();
    this.scheduler.setSyncEngine(this);
  }

  /**
   * Schedule a single sync for a connection
   */
  async scheduleConnectionSync(
    connectionId: string,
    syncName: string,
    syncInterval?: number
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection '${connectionId}' not found`);
    }

    const integration = this.getIntegration(connection.integrationId);
    if (!integration) {
      throw new Error(`Integration '${connection.integrationId}' not found`);
    }

    const connector = this.getConnector(integration.connectorId);
    if (!connector) {
      throw new Error(`Connector '${integration.connectorId}' not found`);
    }

    // Verify sync exists
    const sync = connector.syncs[syncName];
    if (!sync) {
      throw new Error(
        `Sync '${syncName}' not found in connector '${connector.id}'`
      );
    }

    const jobId = `${connectionId}-${syncName}`;
    const interval = syncInterval || connection.syncInterval;

    await this.scheduler.scheduleJob(
      jobId,
      syncName,
      { connectionId, syncName },
      interval
    );

    console.log(
      `Scheduled sync '${syncName}' for connection '${connectionId}'`
    );
  }

  /**
   * Unschedule a single sync for a connection
   */
  async unscheduleConnectionSync(
    connectionId: string,
    syncName: string
  ): Promise<void> {
    const jobId = `${connectionId}-${syncName}`;
    await this.scheduler.unscheduleJob(jobId);
    console.log(
      `Unscheduled sync '${syncName}' for connection '${connectionId}'`
    );
  }

  /**
   * Schedule syncs for a connector connection
   */
  async scheduleAllConnectionSyncs(
    connectionId: string,
    syncInterval?: number
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection '${connectionId}' not found`);
    }

    const integration = this.getIntegration(connection.integrationId);
    if (!integration) {
      throw new Error(`Integration '${connection.integrationId}' not found`);
    }

    const connector = this.getConnector(integration.connectorId);
    if (!connector) {
      throw new Error(`Connector '${integration.connectorId}' not found`);
    }

    for (const [syncName, _sync] of Object.entries(connector.syncs)) {
      const jobId = `${connectionId}-${syncName}`;
      const interval = syncInterval || connection.syncInterval;

      await this.scheduler.scheduleJob(
        jobId,
        syncName,
        { connectionId, syncName },
        interval
      );

      console.log(
        `Scheduled sync '${syncName}' for connection '${connectionId}'`
      );
    }
  }

  /**
   * Unschedule syncs for a connector connection
   */
  async unscheduleAllConnectionSyncs(connectionId: string): Promise<void> {
    await this.scheduler.unscheduleConnectionJobs(connectionId);
    console.log(`Unscheduled syncs for connection '${connectionId}'`);
  }

  /**
   * Get all scheduled jobs
   */
  async getJobs(): Promise<ScheduledJob[]> {
    return this.scheduler.getJobs();
  }

  /**
   * Get jobs for a specific connection
   */
  async getJobsForConnection(connectionId: string): Promise<ScheduledJob[]> {
    return this.scheduler.getJobsForConnection(connectionId);
  }

  /**
   * Execute a sync immediately (one-time execution)
   */
  async executeSync(
    connectionId: string,
    syncName: string
  ): Promise<ExecutionResult> {
    return this.scheduler.executeNow(syncName, { connectionId, syncName });
  }

  /**
   * Execute a sync job (called by the scheduler)
   * This is the core sync execution logic that scheduler uses
   */
  async executeSyncJob(data: SyncJobData): Promise<ExecutionResult> {
    const { connectionId, syncName } = data;
    const startTime = Date.now();

    console.log(
      `Executing sync '${syncName}' for connection '${connectionId}'`
    );

    // Get connection once
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection '${connectionId}' not found`);
    }

    try {
      // Get integration
      const integration = this.getIntegration(connection.integrationId);
      if (!integration) {
        throw new Error(`Integration '${connection.integrationId}' not found`);
      }

      // Get connector
      const connector = this.getConnector(integration.connectorId);
      if (!connector) {
        throw new Error(`Connector '${integration.connectorId}' not found`);
      }

      // Apply rate limiting at the integration level
      if (connector.rateLimit) {
        const key = this.rateLimiter.generateKey(
          connector.rateLimit.strategy ?? "per-integration",
          connector.id,
          connectionId,
          connection.integrationId
        );

        const limitResult = await this.rateLimiter.checkLimit(
          key,
          connector.rateLimit
        );

        if (!limitResult.allowed) {
          throw new Error(
            `Rate limit exceeded for integration '${
              integration.name
            }'. Try again after ${new Date(
              limitResult.resetTime
            ).toISOString()}`
          );
        }
      }

      // Get sync
      const sync = connector.syncs[syncName];
      if (!sync) {
        throw new Error(
          `Sync '${syncName}' not found in connector '${connector.id}'`
        );
      }

      // Execute sync
      const result = await sync.handler(connection);
      const executionTime = Date.now() - startTime;

      // Update connection metadata
      await this.updateConnectionMetadata(connectionId, {
        syncs: {
          ...connection.metadata?.syncs,
          [syncName]: {
            success: true,
            lastRun: new Date(),
            executionTime,
            lastResult: result as ExecutionResult,
          },
        },
      });

      const timestamp = new Date();

      console.log(
        `Sync '${syncName}' for connection '${connectionId}' completed successfully in ${executionTime}ms at ${timestamp.toISOString()}`
      );

      return {
        success: true,
        data: result,
        executionTime,
        timestamp,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(
        `Sync '${syncName}' failed for connection '${connectionId}':`,
        error
      );

      // Update connection metadata (safe since connection is already fetched)
      await this.updateConnectionMetadata(connectionId, {
        syncs: {
          ...(connection.metadata?.syncs ?? {}),
          [syncName]: {
            success: false,
            lastRun: new Date(),
            executionTime,
            lastResult: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.scheduler.destroy();
  }
}
