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
    this.app.delete(
      "/api/connections/:id",
      strictLimiter,
      this.removeConnection.bind(this)
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
  private async getConnections(_req: Request, res: Response) {
    try {
      const connections = this.engine.getConnections();
      return res.json(connections);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private async getConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = this.engine.getConnection(id);
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
  private async getScheduledJobs(_req: Request, res: Response) {
    try {
      const jobs = await this.engine.getScheduledJobs();
      return res.json(jobs);
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
      const connections = this.engine.getConnections();
      const jobs = await this.engine.getScheduledJobs();

      return res.json({
        status: "running",
        timestamp: new Date().toISOString(),
        stats: {
          connectors: connectors.length,
          integrations: integrations.length,
          connections: connections.length,
          scheduledJobs: jobs.length,
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
