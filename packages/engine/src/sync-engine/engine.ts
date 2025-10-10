import { Connection, Connector, Integration } from "@databite/types";
import {
  SchedulerAdapter,
  SyncEngineConfig,
  ScheduledJob,
  ExecutionResult,
  SyncJobData,
} from "./types";
import { IntegrationRateLimiter } from "../rate-limiter/rate-limiter";

/**
 * Engine for scheduling and executing syncs for connector connections.
 * Uses a pluggable adapter pattern for scheduling.
 */
export class SyncEngine {
  private adapter: SchedulerAdapter;
  private minutesBetweenSyncs: number;
  private getConnection: (id: string) => Connection<any> | undefined;
  private getIntegration: (id: string) => Integration<any> | undefined;
  private getConnector: (id: string) => Connector<any, any> | undefined;
  private rateLimiter: IntegrationRateLimiter;

  constructor(config: SyncEngineConfig) {
    this.adapter = config.adapter;
    this.minutesBetweenSyncs = config.minutesBetweenSyncs;
    this.getConnection = config.getConnection;
    this.getIntegration = config.getIntegration;
    this.getConnector = config.getConnector;
    this.rateLimiter = config.rateLimiter || new IntegrationRateLimiter();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  /**
   * Schedule syncs for a connector connection
   */
  async scheduleConnectionSyncs(connectionId: string): Promise<void> {
    const connection = this.getConnection(connectionId);
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
      const schedule = this.minutesBetweenSyncs;

      await this.adapter.scheduleJob(
        jobId,
        syncName,
        { connectionId, syncName },
        schedule
      );

      console.log(
        `Scheduled sync '${syncName}' for connection '${connectionId}'`
      );
    }
  }

  /**
   * Unschedule syncs for a connector connection
   */
  async unscheduleConnectionSyncs(connectionId: string): Promise<void> {
    await this.adapter.unscheduleConnectionJobs(connectionId);
    console.log(`Unscheduled syncs for connection '${connectionId}'`);
  }

  /**
   * Get all scheduled jobs
   */
  async getJobs(): Promise<ScheduledJob[]> {
    return this.adapter.getJobs();
  }

  /**
   * Get jobs for a specific connection
   */
  async getJobsForConnection(connectionId: string): Promise<ScheduledJob[]> {
    return this.adapter.getJobsForConnection(connectionId);
  }

  /**
   * Execute a sync immediately (one-time execution)
   */
  async executeSync(
    connectionId: string,
    syncName: string
  ): Promise<ExecutionResult> {
    return this.adapter.executeNow(syncName, { connectionId, syncName });
  }

  /**
   * Execute a sync job (called by adapters)
   * This is the core sync execution logic that adapters use
   */
  async executeSyncJob(data: SyncJobData): Promise<ExecutionResult> {
    const { connectionId, syncName } = data;
    const startTime = Date.now();

    try {
      const connection = this.getConnection(connectionId);
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

      const sync = connector.syncs[syncName];
      if (!sync) {
        throw new Error(
          `Sync '${syncName}' not found in connector '${connector.id}'`
        );
      }

      const result = await sync.handler(connection);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `Sync '${syncName}' failed for connection '${connectionId}':`,
        error
      );

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
    await this.adapter.destroy();
  }
}
