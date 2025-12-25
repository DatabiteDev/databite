import { Connection, Connector, Integration } from "@databite/types";
import { SyncEngine } from "../sync-engine";
import { ScheduledJob, ExecutionResult } from "../sync-engine/types";
import { RateLimiter } from "../rate-limiter/rate-limiter";
import { ActionExecutor } from "../action-executer/action-executer";
import { FlowSessionManager } from "../flow-manager/flow-session-manager";
import {
  EngineConfig,
  ConnectionStore,
  PaginationParams,
  PaginatedResponse,
} from "./types";
import { InMemoryConnectionStore } from "./in-memory-connection-store";

/**
 * Engine for scheduling and executing syncs for connector connections.
 * Manages recurring sync operations based on cron or interval schedules.
 */
export class DatabiteEngine {
  private syncEngine: SyncEngine;
  private actionExecutor: ActionExecutor;
  private flowSessionManager: FlowSessionManager;
  private connectionStore: ConnectionStore;
  private connectors: Map<string, Connector<any, any>> = new Map<
    string,
    Connector<any, any>
  >();
  private integrations: Map<string, Integration<any>> = new Map<
    string,
    Integration<any>
  >();
  private rateLimiter: RateLimiter = new RateLimiter();

  constructor(config: EngineConfig) {
    // Store connection store
    this.connectionStore =
      config.connectionStore || new InMemoryConnectionStore();

    // Validate that connectors array is provided
    if (!config.connectors || config.connectors.length === 0) {
      throw new Error("At least one connector must be provided");
    }

    // Add all provided connectors to the connectors map
    config.connectors.forEach((connector) => {
      this.connectors.set(connector.id, connector);
    });

    // Initialize Sync Engine
    this.syncEngine = new SyncEngine({
      getConnection: (id) => this.getConnection(id),
      getIntegration: (id) => this.integrations.get(id),
      getConnector: (id) => this.connectors.get(id),
      updateConnectionMetadata: (id, metadata) =>
        this.updateConnectionMetadata(id, metadata),
      rateLimiter: this.rateLimiter,
    });

    // Initialize Action Executor
    this.actionExecutor = new ActionExecutor({
      getConnection: (id) => this.getConnection(id),
      getIntegration: (id) => this.integrations.get(id),
      getConnector: (id) => this.connectors.get(id),
      rateLimiter: this.rateLimiter,
    });

    // Initialize the flow manager
    this.flowSessionManager = new FlowSessionManager();

    // Start the expired session cleanup
    this.startSessionCleanup();
  }

  /** Clean up expired sessions every 5 minutes*/
  private startSessionCleanup() {
    setInterval(() => {
      const cleaned = this.flowSessionManager.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired flow sessions`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Add a connection to the engine
   */
  async addConnection(connection: Connection<any>): Promise<Connection<any>> {
    // Check if connection's integration is supported
    const integration = this.getIntegrationById(connection.integrationId);
    if (!integration) {
      throw new Error(
        `Integration ${connection.integrationId} is not supported`
      );
    }

    // Check if connection already exists
    const existingConnection = await this.connectionStore.read(connection.id);
    if (existingConnection) {
      throw new Error(`Connection ${connection.id} already exists`);
    }

    // Add connection to the connection store
    const createdConnection = await this.connectionStore.create(connection);

    // Schedule only the active syncs
    if (connection.activeSyncs && connection.activeSyncs.length > 0) {
      await this.scheduleConnectionSyncs(
        connection.id,
        connection.syncInterval,
        connection.activeSyncs
      );
    }

    return createdConnection;
  }

  /**
   * Update a connection's metadata
   */
  async updateConnectionMetadata(
    connectionId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // Update metadata
    connection.metadata = { ...connection.metadata, ...metadata };

    // Update connection store
    await this.connectionStore.update(connection);
  }

  /**
   * Update an entire connection
   */
  async updateConnection(
    connection: Connection<any>
  ): Promise<Connection<any>> {
    const existingConnection = await this.connectionStore.read(connection.id);
    if (!existingConnection) {
      throw new Error(`Connection ${connection.id} not found`);
    }

    // Update connection store
    return await this.connectionStore.update(connection);
  }

  /**
   * Remove a connection from the engine
   */
  async removeConnection(connectionId: string): Promise<void> {
    const connection = await this.connectionStore.read(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Unschedule syncs for the connection
    await this.unscheduleAllConnectionSyncs(connectionId);

    // Delete connection from connection store
    await this.connectionStore.delete(connectionId);
  }

  /**
   * Add an integration to the engine (stored locally)
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

    // Add integration to local storage
    this.integrations.set(integration.id, integration);
  }

  /**
   * Remove an integration from the engine
   */
  async removeIntegration(integrationId: string): Promise<void> {
    if (!this.integrations.has(integrationId)) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Check if any connections use this integration
    const allConnections = await this.connectionStore.readAll();
    const connectionsUsingIntegration = allConnections.data.filter(
      (conn) => conn.integrationId === integrationId
    );

    if (connectionsUsingIntegration.length > 0) {
      throw new Error(
        `Cannot remove integration ${integrationId}: ${connectionsUsingIntegration.length} connection(s) still using it`
      );
    }

    // Remove integration from local storage
    this.integrations.delete(integrationId);
  }

  /**
   * Activate a sync for a connection (schedule it to run)
   */
  async activateSync(
    connectionId: string,
    syncName: string,
    syncInterval?: number
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const integration = this.getIntegrationById(connection.integrationId);
    if (!integration) {
      throw new Error(`Integration ${connection.integrationId} not found`);
    }

    const connector = this.getConnectorById(integration.connectorId);
    if (!connector) {
      throw new Error(`Connector ${integration.connectorId} not found`);
    }

    // Verify sync exists
    if (!connector.syncs[syncName]) {
      throw new Error(
        `Sync '${syncName}' not found in connector '${connector.id}'`
      );
    }

    // Initialize activeSyncs if not present
    if (!connection.activeSyncs) {
      connection.activeSyncs = [];
    }

    // Check if already active
    if (connection.activeSyncs.includes(syncName)) {
      throw new Error(`Sync '${syncName}' is already active`);
    }

    // Add to active syncs
    connection.activeSyncs.push(syncName);
    await this.connectionStore.update(connection);

    // Schedule the sync
    if (syncInterval) {
      await this.syncEngine.scheduleConnectionSync(
        connectionId,
        syncName,
        syncInterval
      );
    } else {
      await this.syncEngine.scheduleConnectionSync(connectionId, syncName);
    }

    console.log(
      `Activated sync '${syncName}' for connection '${connectionId}'`
    );
  }

  /**
   * Deactivate a sync for a connection (unschedule it)
   */
  async deactivateSync(connectionId: string, syncName: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Initialize activeSyncs if not present
    if (!connection.activeSyncs) {
      connection.activeSyncs = [];
    }

    // Check if sync is active
    const syncIndex = connection.activeSyncs.indexOf(syncName);
    if (syncIndex === -1) {
      throw new Error(`Sync '${syncName}' is not active`);
    }

    // Remove from active syncs
    connection.activeSyncs.splice(syncIndex, 1);
    await this.connectionStore.update(connection);

    // Unschedule the sync
    await this.syncEngine.unscheduleConnectionSync(connectionId, syncName);

    console.log(
      `Deactivated sync '${syncName}' for connection '${connectionId}'`
    );
  }

  /**
   * Schedule syncs for a connection (only specified syncs, or all active syncs if not specified)
   */
  async scheduleConnectionSyncs(
    connectionId: string,
    syncInterval?: number,
    syncNames?: string[]
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const syncsToSchedule = syncNames || connection.activeSyncs || [];

    for (const syncName of syncsToSchedule) {
      if (syncInterval) {
        await this.syncEngine.scheduleConnectionSync(
          connectionId,
          syncName,
          syncInterval
        );
      } else {
        await this.syncEngine.scheduleConnectionSync(connectionId, syncName);
      }
    }
  }

  /**
   * Schedule all possible syncs for a connection
   */
  async scheduleAllConnectionSyncs(
    connectionId: string,
    syncInterval?: number
  ): Promise<void> {
    if (syncInterval) {
      return this.syncEngine.scheduleAllConnectionSyncs(
        connectionId,
        syncInterval
      );
    } else {
      return this.syncEngine.scheduleAllConnectionSyncs(connectionId);
    }
  }

  /**
   * Unschedule all possible syncs for a connection
   */
  async unscheduleAllConnectionSyncs(connectionId: string): Promise<void> {
    return this.syncEngine.unscheduleAllConnectionSyncs(connectionId);
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
  async getAllScheduledJobs(): Promise<ScheduledJob[]> {
    return this.syncEngine.getJobs();
  }

  /**
   * Get all scheduled jobs with pagination
   */
  async getScheduledJobs(
    params?: PaginationParams
  ): Promise<PaginatedResponse<ScheduledJob>> {
    // Get all jobs from sync engine
    const allJobs = await this.syncEngine.getJobs();
    const total = allJobs.length;

    // Default pagination values
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Slice the data for the current page
    const data = allJobs.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
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

  /**Start a flow session */
  async startFlowSession(integrationId: string) {
    const integration = this.getIntegrationById(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const connector = this.getConnectorById(integration.connectorId);
    if (!connector) {
      throw new Error("Connector not found");
    }

    if (!connector.authenticationFlow) {
      throw new Error("No authentication flow available");
    }

    // Create session with integration config as initial context
    const sessionId = this.flowSessionManager.createSession(
      connector.id,
      connector,
      {
        integration: integration.config,
        integrationId: integration.id,
      }
    );

    // Execute first step (might auto-execute non-interactive blocks)
    const result = await this.flowSessionManager.executeStep(
      sessionId,
      connector
    );

    return result;
  }

  /**Execute a flow's step */
  async executeFlowStep(sessionId: string, userInput?: any) {
    const session = this.flowSessionManager.getSession(sessionId);
    if (!session) {
      throw new Error("Flow session not found or expired");
    }

    // Get connector from session context
    const connectorId = session.context._connectorId;
    if (!connectorId) {
      throw new Error("Invalid session state");
    }

    const connector = this.getConnectorById(connectorId);
    if (!connector) {
      throw new Error("Connector not found");
    }

    const result = await this.flowSessionManager.executeStep(
      sessionId,
      connector,
      userInput
    );

    return result;
  }

  /**Get a flow session */
  async getFlowSession(sessionId: string) {
    const session = this.flowSessionManager.getSession(sessionId);

    if (!session) {
      throw new Error("Flow session not found or expired");
    }

    return session;
  }

  /**Delete a flow session */
  async deleteFlowSession(sessionId: string) {
    this.flowSessionManager.deleteSession(sessionId);
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
   * Get all connections from the connection store with pagination
   */
  async getConnections(
    params?: PaginationParams
  ): Promise<PaginatedResponse<Connection<any>>> {
    return await this.connectionStore.readAll(params);
  }

  /**
   * Get all integrations (stored locally)
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
   * Get a connection by ID from the connection store
   */
  async getConnection(
    connectionId: string
  ): Promise<Connection<any> | undefined> {
    return await this.connectionStore.read(connectionId);
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
    // Destroy sync engine
    await this.syncEngine.destroy();

    // Clear local maps
    this.integrations.clear();
    this.connectors.clear();
  }
}
