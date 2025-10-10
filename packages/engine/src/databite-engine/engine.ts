import { Connection, Connector, Integration } from "@databite/types";
import { connectors } from "@databite/connectors";
import { SyncEngine } from "../sync-engine";
import {
  SchedulerAdapter,
  ScheduledJob,
  ExecutionResult,
} from "../sync-engine/types";
import { IntegrationRateLimiter } from "../rate-limiter/rate-limiter";
import { ActionExecutor } from "../action-executer/action-executer";

/**
 * Provider method for fetching connections and integrations
 */
export type DataProvider = () => Promise<{
  connections: Connection<any>[];
  integrations: Integration<any>[];
}>;

/**
 * Method that exports data from the Engine, used to permanently persist data from the Engine
 */
export type DataExporter = ({
  connections,
  integrations,
}: {
  connections: Connection<any>[];
  integrations: Integration<any>[];
}) => Promise<{ success: boolean; error: string | null }>;

/**
 * Configuration options for the SyncEngine
 */
export interface EngineConfig {
  customConnectors?: Connector<any, any>[];
  dataProvider?: DataProvider;
  dataExporter?: DataExporter;
  refreshInterval?: number; // in milliseconds, default 5 minutes
  schedulerAdapter: SchedulerAdapter;
  minutesBetweenSyncs: number;
}

/**
 * Engine for scheduling and executing syncs for connector connections.
 * Manages recurring sync operations based on cron or interval schedules.
 */
export class DatabiteEngine {
  private syncEngine: SyncEngine;
  private actionExecutor: ActionExecutor;
  private dataProvider: DataProvider | undefined;
  private dataExporter: DataExporter | undefined;
  private refreshInterval: number;
  private refreshTimer: NodeJS.Timeout | undefined;
  private connectors: Map<string, Connector<any, any>> = new Map<
    string,
    Connector<any, any>
  >(connectors.map((connector) => [connector.id, connector]));
  private connections: Map<string, Connection<any>> = new Map<
    string,
    Connection<any>
  >();
  private integrations: Map<string, Integration<any>> = new Map<
    string,
    Integration<any>
  >();
  private rateLimiter: IntegrationRateLimiter = new IntegrationRateLimiter();

  constructor(config: EngineConfig) {
    // Initialize data providers
    this.dataProvider = config.dataProvider;
    // Initialize data exporter
    this.dataExporter = config.dataExporter;
    // Set refresh interval (default 5 minutes)
    this.refreshInterval = config.refreshInterval ?? 5 * 60 * 1000;

    // Add custom connectors to the connectors map
    if (config.customConnectors) {
      config.customConnectors.forEach((connector) => {
        this.connectors.set(connector.id, connector);
      });
    }

    // Initialize Sync Engine
    this.syncEngine = new SyncEngine({
      adapter: config.schedulerAdapter,
      minutesBetweenSyncs: config.minutesBetweenSyncs,
      getConnection: (id) => this.connections.get(id),
      getIntegration: (id) => this.integrations.get(id),
      getConnector: (id) => this.connectors.get(id),
      rateLimiter: this.rateLimiter,
    });

    // Initialize Action Executor
    this.actionExecutor = new ActionExecutor({
      getConnection: (id) => this.connections.get(id),
      getIntegration: (id) => this.integrations.get(id),
      getConnector: (id) => this.connectors.get(id),
      rateLimiter: this.rateLimiter,
    });

    // Initialize connections and integrations from data provider
    if (this.dataProvider) {
      this.loadData().then(() => {
        // Start periodic data refresh if provider is available
        this.startDataRefresh();
      });
    }
  }

  /**
   * Load data from the data provider
   */
  private async loadData(): Promise<void> {
    if (!this.dataProvider) return;

    try {
      const { connections, integrations } = await this.dataProvider();

      this.connections = new Map<string, Connection<any>>(
        connections.map((connection) => [connection.id, connection])
      );

      this.integrations = new Map<string, Integration<any>>(
        integrations.map((integration) => [integration.id, integration])
      );

      console.log(
        `Loaded ${connections.length} connections and ${integrations.length} integrations`
      );
    } catch (err) {
      console.error(
        "Failed to load connections and integrations from data provider:",
        err
      );
      throw err;
    }
  }

  /**
   * Start periodic data refresh from provider
   */
  private startDataRefresh(): void {
    if (!this.dataProvider || this.refreshTimer) return;

    this.refreshTimer = setInterval(() => {
      this.loadData().catch((err) => {
        console.error("Failed to refresh data:", err);
      });
    }, this.refreshInterval);
  }

  /**
   * Stop periodic data refresh
   */
  private stopDataRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Export current data using the data exporter
   */
  async exportData(): Promise<{ success: boolean; error: string | null }> {
    if (!this.dataExporter) {
      return {
        success: false,
        error: "No data exporter configured",
      };
    }

    try {
      return await this.dataExporter({
        connections: Array.from(this.connections.values()),
        integrations: Array.from(this.integrations.values()),
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Add a connection to the engine
   */
  async addConnection(connection: Connection<any>): Promise<void> {
    // Check if connection's integration is supported
    const integration = this.getIntegrationById(connection.integrationId);
    if (!integration) {
      throw new Error(
        `Integration ${connection.integrationId} is not supported`
      );
    }

    // Check if connection already exists
    if (this.connections.has(connection.id)) {
      throw new Error(`Connection ${connection.id} already exists`);
    }

    // Add connection to the engine
    this.connections.set(connection.id, connection);

    // Schedule syncs for the new connection
    await this.scheduleConnectionSyncs(connection.id);

    // Export data if exporter is configured
    await this.exportData();
  }

  /**
   * Remove a connection from the engine
   */
  async removeConnection(connectionId: string): Promise<void> {
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Unschedule syncs for the connection
    await this.unscheduleConnectionSyncs(connectionId);

    // Remove connection
    this.connections.delete(connectionId);

    // Export data if exporter is configured
    await this.exportData();
  }

  /**
   * Add an integration to the engine
   */
  async addIntegration(integration: Integration<any>): Promise<void> {
    // Check if integration's connector is supported
    const connector = this.getConnectorById(integration.connectorId);
    if (!connector) {
      throw new Error(`Connector ${integration.connectorId} is not supported`);
    }

    // Check if integration already exists
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration ${integration.id} already exists`);
    }

    // Add integration to the engine
    this.integrations.set(integration.id, integration);

    // Export data if exporter is configured
    await this.exportData();
  }

  /**
   * Remove an integration from the engine
   */
  async removeIntegration(integrationId: string): Promise<void> {
    if (!this.integrations.has(integrationId)) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Check if any connections use this integration
    const connectionsUsingIntegration = Array.from(
      this.connections.values()
    ).filter((conn) => conn.integrationId === integrationId);

    if (connectionsUsingIntegration.length > 0) {
      throw new Error(
        `Cannot remove integration ${integrationId}: ${connectionsUsingIntegration.length} connection(s) still using it`
      );
    }

    // Remove integration
    this.integrations.delete(integrationId);

    // Export data if exporter is configured
    await this.exportData();
  }

  /**
   * Schedule syncs for a connection
   */
  async scheduleConnectionSyncs(connectionId: string): Promise<void> {
    return this.syncEngine.scheduleConnectionSyncs(connectionId);
  }

  /**
   * Unschedule syncs for a connection
   */
  async unscheduleConnectionSyncs(connectionId: string): Promise<void> {
    return this.syncEngine.unscheduleConnectionSyncs(connectionId);
  }

  /**
   * Execute a sync immediately (one-time execution)
   */
  async executeSync(
    connectionId: string,
    syncName: string
  ): Promise<ExecutionResult> {
    return this.syncEngine.executeSync(connectionId, syncName);
  }

  /**
   * Get all scheduled jobs
   */
  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return this.syncEngine.getJobs();
  }

  /**
   * Get scheduled jobs for a specific connection
   */
  async getConnectionJobs(connectionId: string): Promise<ScheduledJob[]> {
    return this.syncEngine.getJobsForConnection(connectionId);
  }

  /**
   * Execute an action for a connection
   */
  async executeAction(
    connectionId: string,
    actionName: string,
    params: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
  }> {
    return this.actionExecutor.executeAction(connectionId, actionName, params);
  }

  /**
   * Get available actions for a connection
   */
  getConnectorActions(connectorId: string): string[] {
    // Get connector by ID
    const connector = this.getConnectorById(connectorId);
    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found`);
    }

    // Return available actions
    return Object.keys(connector.actions);
  }

  /**
   * Get all connections
   */
  getConnections(): Connection<any>[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get all integrations
   */
  getIntegrations(): Integration<any>[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get all connectors
   */
  getConnectors(): Connector<any, any>[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Get a connection by ID
   */
  getConnection(connectionId: string): Connection<any> | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get an integration by ID
   */
  getIntegrationById(integrationId: string): Integration<any> | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * Get an integration by name
   */
  getIntegrationByName(integrationName: string): Integration<any> | undefined {
    return Array.from(this.integrations.values()).find(
      (integration) => integration.name === integrationName
    );
  }

  /**
   * Get a connector by ID
   */
  getConnectorById(connectorId: string): Connector<any, any> | undefined {
    return this.connectors.get(connectorId);
  }

  /**
   * Get a connector by name
   */
  getConnectorByName(connectorName: string): Connector<any, any> | undefined {
    return Array.from(this.connectors.values()).find(
      (connector) => connector.name === connectorName
    );
  }

  /**
   * Clean up resources and stop the engine
   */
  async destroy(): Promise<void> {
    // Stop data refresh
    this.stopDataRefresh();

    // Destroy sync engine
    await this.syncEngine.destroy();

    // Clear all maps
    this.connections.clear();
    this.integrations.clear();
    this.connectors.clear();
  }
}
