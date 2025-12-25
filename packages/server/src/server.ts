import * as z from "zod";
import express from "express";
import type { Express, Request, Response } from "express";
import { DatabiteEngine, EngineConfig } from "@databite/engine";
import { Connection, Integration } from "@databite/types";
import { sanitizeConnector, sanitizeConnectors } from "./utils";
import type { StartFlowRequest, ExecuteStepRequest } from "@databite/types";
import {
  SecurityMiddleware,
  SecurityConfig,
  strictLimiter,
  moderateLimiter,
} from "./security";

export interface ServerConfig {
  port: number;
  engineConfig: EngineConfig;
  security?: SecurityConfig;
}

export class DatabiteServer {
  private app: Express;
  private engine: DatabiteEngine;
  private port: number;
  private security: SecurityMiddleware;

  constructor(config: ServerConfig) {
    this.app = express();
    this.port = config.port;
    this.engine = new DatabiteEngine(config.engineConfig);
    this.security = new SecurityMiddleware(config.security);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Security headers (helmet)
    this.app.use(this.security.getHelmet());

    // Request size limits
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // CORS with origin validation
    this.app.use(this.security.getCorsMiddleware());

    // IP filtering
    this.app.use(this.security.getIpFilter());

    // Global rate limiting
    this.app.use(this.security.getRateLimiter());

    // Input sanitization
    this.app.use(this.security.getSanitizer());

    // Request validation
    this.app.use(this.security.getRequestValidator());

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Connector routes (read-only, moderate limits)
    this.app.get(
      "/api/connectors",
      moderateLimiter,
      this.getConnectors.bind(this)
    );
    this.app.get(
      "/api/connectors/:id",
      moderateLimiter,
      this.getConnector.bind(this)
    );

    // Integration routes (read-only, moderate limits)
    this.app.get(
      "/api/integrations",
      moderateLimiter,
      this.getIntegrations.bind(this)
    );
    this.app.get(
      "/api/integrations/:id",
      moderateLimiter,
      this.getIntegration.bind(this)
    );

    // Connection routes (write operations, stricter limits)
    this.app.get(
      "/api/connections",
      moderateLimiter,
      this.getConnections.bind(this)
    );
    this.app.get(
      "/api/connections/:id",
      moderateLimiter,
      this.getConnection.bind(this)
    );
    this.app.post(
      "/api/connections",
      strictLimiter,
      this.addConnection.bind(this)
    );
    this.app.put(
      "/api/connections/:id",
      strictLimiter,
      this.updateConnection.bind(this)
    );
    this.app.delete(
      "/api/connections/:id",
      strictLimiter,
      this.removeConnection.bind(this)
    );

    // Connection sync management routes
    this.app.post(
      "/api/connections/:connectionId/syncs/:syncName/activate",
      strictLimiter,
      this.activateSync.bind(this)
    );
    this.app.post(
      "/api/connections/:connectionId/syncs/:syncName/deactivate",
      strictLimiter,
      this.deactivateSync.bind(this)
    );
    this.app.get(
      "/api/connections/:connectionId/syncs",
      moderateLimiter,
      this.getAvailableSyncs.bind(this)
    );

    // Flow routes (write operations, stricter limits)
    this.app.post("/api/flows/start", strictLimiter, this.startFlow.bind(this));
    this.app.post(
      "/api/flows/:sessionId/step",
      moderateLimiter,
      this.executeFlowStep.bind(this)
    );
    this.app.get(
      "/api/flows/:sessionId",
      moderateLimiter,
      this.getFlowSession.bind(this)
    );
    this.app.delete(
      "/api/flows/:sessionId",
      strictLimiter,
      this.deleteFlowSession.bind(this)
    );

    // Sync routes
    this.app.get(
      "/api/sync/jobs",
      moderateLimiter,
      this.getScheduledJobs.bind(this)
    );
    this.app.get(
      "/api/sync/jobs/:connectionId",
      moderateLimiter,
      this.getConnectionJobs.bind(this)
    );
    this.app.post(
      "/api/sync/execute/:connectionId/:syncName",
      strictLimiter,
      this.executeSync.bind(this)
    );
    this.app.post(
      "/api/sync/schedule/:connectionId",
      strictLimiter,
      this.scheduleConnectionSyncs.bind(this)
    );
    this.app.delete(
      "/api/sync/schedule/:connectionId",
      strictLimiter,
      this.unscheduleConnectionSyncs.bind(this)
    );
    this.app.get(
      "/api/connectors/:id/syncs",
      moderateLimiter,
      this.getConnectorSyncs.bind(this)
    );

    // Action routes
    this.app.get(
      "/api/actions/:connectorId",
      moderateLimiter,
      this.getConnectorActions.bind(this)
    );
    this.app.post(
      "/api/actions/execute/:connectionId/:actionName",
      strictLimiter,
      this.executeAction.bind(this)
    );

    // Health routes (no rate limiting)
    this.app.get("/api/health", this.healthCheck.bind(this));
    this.app.get("/api/status", moderateLimiter, this.getStatus.bind(this));

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: "Endpoint not found" });
    });

    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error("[Server Error]", err);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });
  }

  // Connector route handlers
  private async getConnectors(_req: Request, res: Response) {
    try {
      const connectors = this.engine.getConnectors();
      const sanitized = sanitizeConnectors(connectors);
      return res.json(sanitized);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async getConnector(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connector = this.engine.getConnectorById(id);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }
      const sanitized = sanitizeConnector(connector);
      return res.json(sanitized);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Integration route handlers
  private async getIntegrations(_req: Request, res: Response) {
    try {
      const integrations = this.engine.getIntegrations();
      return res.json(integrations);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async getIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const integration = this.engine.getIntegrationById(id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      return res.json(integration);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Connection route handlers
  private async getConnections(req: Request, res: Response) {
    try {
      // Parse query parameters for pagination
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;

      // Validate pagination parameters
      if (page < 1) {
        return res.status(400).json({ error: "Page must be greater than 0" });
      }
      if (limit < 1 || limit > 100) {
        return res
          .status(400)
          .json({ error: "Limit must be between 1 and 100" });
      }

      const result = await this.engine.getConnections({ page, limit });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async getConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await this.engine.getConnection(id);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }
      return res.json(connection);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async addConnection(req: Request, res: Response) {
    try {
      const connection = req.body as Connection<any>;
      await this.engine.addConnection(connection);
      return res
        .status(201)
        .json({ message: "Connection added successfully", connection });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to add connection",
      });
    }
  }

  private async removeConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.engine.removeConnection(id);
      return res.json({ message: "Connection removed successfully" });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove connection",
      });
    }
  }

  private async updateConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connectionData = req.body as Connection<any>;

      // Ensure the ID in the URL matches the ID in the body
      if (connectionData.id && connectionData.id !== id) {
        return res.status(400).json({
          error: "Connection ID in URL does not match ID in body",
        });
      }

      // Set the ID from URL to ensure consistency
      connectionData.id = id;

      const updatedConnection = await this.engine.updateConnection(
        connectionData
      );
      return res.json({
        message: "Connection updated successfully",
        connection: updatedConnection,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update connection",
      });
    }
  }

  // Connection sync management handlers
  private async activateSync(req: Request, res: Response) {
    try {
      const { connectionId, syncName } = req.params;
      const { syncInterval } = req.body;

      await this.engine.activateSync(connectionId, syncName, syncInterval);
      return res.json({
        message: `Sync '${syncName}' activated successfully`,
        connectionId,
        syncName,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to activate sync",
      });
    }
  }

  private async deactivateSync(req: Request, res: Response) {
    try {
      const { connectionId, syncName } = req.params;
      await this.engine.deactivateSync(connectionId, syncName);
      return res.json({
        message: `Sync '${syncName}' deactivated successfully`,
        connectionId,
        syncName,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to deactivate sync",
      });
    }
  }

  private async getAvailableSyncs(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      // Get connection to find its connector
      const connection = await this.engine.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      // Get integration
      const integration = this.engine.getIntegrationById(
        connection.integrationId
      );
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Get connector
      const connector = this.engine.getConnectorById(integration.connectorId);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }

      const activeSyncs = connection.activeSyncs || [];

      // Map all available syncs with their active status
      const syncs = Object.entries(connector.syncs).map(([syncName, sync]) => ({
        name: syncName,
        id: sync.id,
        label: sync.label,
        description: sync.description,
        maxRetries: sync.maxRetries,
        timeout: sync.timeout,
        isActive: activeSyncs.includes(syncName),
        outputSchema: z.toJSONSchema(sync.outputSchema),
      }));

      return res.json(syncs);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get available syncs",
      });
    }
  }

  // Flow route handlers
  private async startFlow(req: Request, res: Response) {
    try {
      const { integrationId } = req.body as StartFlowRequest;

      if (!integrationId) {
        return res.status(400).json({ error: "integrationId is required" });
      }

      const result = await this.engine.startFlowSession(integrationId);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to start flow",
      });
    }
  }

  private async executeFlowStep(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { input } = req.body as ExecuteStepRequest;

      const result = await this.engine.executeFlowStep(sessionId, input);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to execute step",
      });
    }
  }

  private async getFlowSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await this.engine.getFlowSession(sessionId);
      return res.json(session);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async deleteFlowSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      await this.engine.deleteFlowSession(sessionId);
      return res.json({ message: "Flow session deleted successfully" });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Sync route handlers
  private async getScheduledJobs(req: Request, res: Response) {
    try {
      // Parse query parameters for pagination
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;

      // Validate pagination parameters
      if (page < 1) {
        return res.status(400).json({ error: "Page must be greater than 0" });
      }
      if (limit < 1 || limit > 100) {
        return res
          .status(400)
          .json({ error: "Limit must be between 1 and 100" });
      }

      const result = await this.engine.getScheduledJobs({ page, limit });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async getConnectionJobs(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const jobs = await this.engine.getConnectionJobs(connectionId);
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async executeSync(req: Request, res: Response) {
    try {
      const { connectionId, syncName } = req.params;
      const result = await this.engine.executeSync(connectionId, syncName);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to execute sync",
      });
    }
  }

  private async scheduleConnectionSyncs(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { syncInterval, syncNames } = req.body;

      // Verify connection exists
      const connection = await this.engine.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      await this.engine.scheduleConnectionSyncs(
        connectionId,
        syncInterval,
        syncNames
      );
      return res.json({
        message: "Connection syncs scheduled successfully",
        connectionId,
        scheduledSyncs: syncNames || connection.activeSyncs || [],
      });
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to schedule syncs",
      });
    }
  }

  private async unscheduleConnectionSyncs(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      // Verify connection exists
      const connection = await this.engine.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      await this.engine.unscheduleAllConnectionSyncs(connectionId);
      return res.json({
        message: "Connection syncs unscheduled successfully",
        connectionId,
      });
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to unschedule syncs",
      });
    }
  }

  private async getConnectorSyncs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connector = this.engine.getConnectorById(id);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }

      const syncs = Object.entries(connector.syncs || {}).map(
        ([key, sync]) => ({
          name: key,
          id: sync.id,
          label: sync.label,
          description: sync.description,
          maxRetries: sync.maxRetries,
          timeout: sync.timeout,
          outputSchema: z.toJSONSchema(sync.outputSchema),
        })
      );

      return res.json(syncs);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get connector syncs",
      });
    }
  }

  // Action route handlers
  private async getConnectorActions(req: Request, res: Response) {
    try {
      const { connectorId } = req.params;
      const connector = this.engine.getConnectorById(connectorId);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }

      const actions = Object.entries(connector.actions).map(
        ([key, action]) => ({
          name: key,
          id: action.id,
          label: action.label,
          description: action.description,
          maxRetries: action.maxRetries,
          timeout: action.timeout,
          inputSchema: z.toJSONSchema(action.inputSchema),
          outputSchema: z.toJSONSchema(action.outputSchema),
        })
      );

      return res.json(actions);
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get connector actions",
      });
    }
  }

  private async executeAction(req: Request, res: Response) {
    try {
      const { connectionId, actionName } = req.params;
      const params = req.body;

      const result = await this.engine.executeAction(
        connectionId,
        actionName,
        params
      );
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to execute action",
      });
    }
  }

  // Health route handlers
  private healthCheck(_req: Request, res: Response) {
    return res.json({ status: "healthy", timestamp: new Date().toISOString() });
  }

  private async getStatus(_req: Request, res: Response) {
    try {
      const connectors = this.engine.getConnectors();
      const integrations = this.engine.getIntegrations();
      const connectionsResult = await this.engine.getConnections();
      const jobsResult = await this.engine.getScheduledJobs();

      return res.json({
        status: "running",
        timestamp: new Date().toISOString(),
        stats: {
          connectors: connectors.length,
          integrations: integrations.length,
          connections: connectionsResult.pagination.total,
          scheduledJobs: jobsResult.pagination.total,
        },
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async start() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`Databite server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    await this.engine.destroy();
  }

  // Helper method to add integrations during setup
  async addIntegration(integration: Integration<any>): Promise<void> {
    await this.engine.addIntegration(integration);
  }
}
