import express from "express";
import type { Express, Request, Response } from "express";
import { DatabiteEngine, EngineConfig } from "@databite/engine";
import { Action, Connection, Integration } from "@databite/types";
import { sanitizeConnector, sanitizeConnectors } from "./utils";
import type { StartFlowRequest, ExecuteStepRequest } from "@databite/types";

export interface ServerConfig {
  port: number;
  engineConfig: EngineConfig;
}

export class DatabiteServer {
  private app: Express;
  private engine: DatabiteEngine;
  private port: number;

  constructor(config: ServerConfig) {
    this.app = express();
    this.port = config.port;
    this.engine = new DatabiteEngine(config.engineConfig);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    // Enable CORS
    this.app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      return next();
    });
  }

  private setupRoutes() {
    // Connector routes
    this.app.get("/api/connectors", this.getConnectors.bind(this));
    this.app.get("/api/connectors/:id", this.getConnector.bind(this));

    // Integration routes
    this.app.get("/api/integrations", this.getIntegrations.bind(this));
    this.app.get("/api/integrations/:id", this.getIntegration.bind(this));

    // Connection routes
    this.app.get("/api/connections", this.getConnections.bind(this));
    this.app.get("/api/connections/:id", this.getConnection.bind(this));
    this.app.post("/api/connections", this.addConnection.bind(this));
    this.app.delete("/api/connections/:id", this.removeConnection.bind(this));

    // Flow routes
    this.app.post("/api/flows/start", this.startFlow.bind(this));
    this.app.post(
      "/api/flows/:sessionId/step",
      this.executeFlowStep.bind(this)
    );
    this.app.get("/api/flows/:sessionId", this.getFlowSession.bind(this));
    this.app.delete("/api/flows/:sessionId", this.deleteFlowSession.bind(this));

    // Sync routes
    this.app.get("/api/sync/jobs", this.getScheduledJobs.bind(this));
    this.app.get(
      "/api/sync/jobs/:connectionId",
      this.getConnectionJobs.bind(this)
    );
    this.app.post(
      "/api/sync/execute/:connectionId/:syncName",
      this.executeSync.bind(this)
    );

    // Action routes
    this.app.get(
      "/api/actions/:connectorId",
      this.getConnectorActions.bind(this)
    );
    this.app.post(
      "/api/actions/execute/:connectionId/:actionName",
      this.executeAction.bind(this)
    );

    // Health routes
    this.app.get("/api/health", this.healthCheck.bind(this));
    this.app.get("/api/status", this.getStatus.bind(this));
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

      const actions = Object.values(connector.actions).map(
        (action: Action<any, any, any>) => ({
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
