import { z } from "zod";
import {
  Connector,
  Integration,
  Connection,
  Action,
  Sync,
  Webhook,
  Flow,
} from "../types";

describe("Type Definitions", () => {
  describe("ConnectorCategory", () => {
    it("should accept valid category values", () => {
      const validCategories = [
        "accounting",
        "analytics",
        "communication",
        "crm",
        "marketing",
        "productivity",
        "social",
        "finance",
      ] as const;

      validCategories.forEach((category) => {
        expect(typeof category).toBe("string");
      });
    });
  });

  describe("Connector", () => {
    const integrationConfig = z.object({
      apiKey: z.string(),
      baseUrl: z.string().optional(),
    });

    const connectionConfig = z.object({
      token: z.string(),
      refreshToken: z.string().optional(),
    });

    const mockConnector: Connector<
      typeof integrationConfig,
      typeof connectionConfig
    > = {
      id: "test-connector",
      name: "Test Connector",
      description: "A test connector",
      author: "Test Author",
      logo: "https://example.com/logo.png",
      documentationUrl: "https://example.com/docs",
      version: "1.0.0",
      tags: ["api", "test"],
      categories: ["dev-tools"],
      integrationConfig,
      connectionConfig,
      actions: {},
      syncs: {},
      webhooks: {},
      authenticationFlow: {
        name: "Test Flow",
        blocks: {},
        blockOrder: [],
      },
      refresh: async () => ({ token: "new-token" }),
      createIntegration: (name, config) => ({
        id: "integration-id",
        connectorId: "test-connector",
        name,
        config,
      }),
    };

    it("should have all required properties", () => {
      expect(mockConnector.id).toBe("test-connector");
      expect(mockConnector.name).toBe("Test Connector");
      expect(mockConnector.description).toBe("A test connector");
      expect(mockConnector.author).toBe("Test Author");
      expect(mockConnector.logo).toBe("https://example.com/logo.png");
      expect(mockConnector.documentationUrl).toBe("https://example.com/docs");
      expect(mockConnector.version).toBe("1.0.0");
      expect(mockConnector.tags).toEqual(["api", "test"]);
      expect(mockConnector.categories).toEqual(["dev-tools"]);
      expect(mockConnector.integrationConfig).toBe(integrationConfig);
      expect(mockConnector.connectionConfig).toBe(connectionConfig);
      expect(mockConnector.actions).toEqual({});
      expect(mockConnector.syncs).toEqual({});
      expect(mockConnector.webhooks).toEqual({});
      expect(mockConnector.authenticationFlow).toBeDefined();
      expect(mockConnector.refresh).toBeDefined();
      expect(mockConnector.createIntegration).toBeDefined();
    });

    it("should create integration correctly", () => {
      const integration = mockConnector.createIntegration("Test Integration", {
        apiKey: "test-key",
        baseUrl: "https://api.example.com",
      });

      expect(integration.id).toBe("integration-id");
      expect(integration.connectorId).toBe("test-connector");
      expect(integration.name).toBe("Test Integration");
      expect(integration.config).toEqual({
        apiKey: "test-key",
        baseUrl: "https://api.example.com",
      });
    });
  });

  describe("Integration", () => {
    const mockIntegration: Integration<any> = {
      id: "integration-1",
      connectorId: "test-connector",
      name: "Test Integration",
      config: {
        apiKey: "test-key",
        baseUrl: "https://api.example.com",
      },
    };

    it("should have all required properties", () => {
      expect(mockIntegration.id).toBe("integration-1");
      expect(mockIntegration.connectorId).toBe("test-connector");
      expect(mockIntegration.name).toBe("Test Integration");
      expect(mockIntegration.config).toEqual({
        apiKey: "test-key",
        baseUrl: "https://api.example.com",
      });
    });
  });

  describe("Connection", () => {
    const mockConnection: Connection<any> = {
      id: "connection-1",
      integrationId: "integration-1",
      connectorId: "test-connector",
      config: {
        token: "access-token",
        refreshToken: "refresh-token",
      },
    };

    it("should have all required properties", () => {
      expect(mockConnection.id).toBe("connection-1");
      expect(mockConnection.integrationId).toBe("integration-1");
      expect(mockConnection.config).toEqual({
        token: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("Action", () => {
    const inputSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const outputSchema = z.object({
      result: z.string(),
      id: z.string(),
    });

    const connectionConfig = z.object({
      token: z.string(),
    });

    const mockAction: Action<
      typeof inputSchema,
      typeof outputSchema,
      typeof connectionConfig
    > = {
      id: "action-1",
      label: "Test Action",
      description: "A test action",
      inputSchema,
      outputSchema,
      maxRetries: 3,
      timeout: 30000,
      handler: async (params) => ({
        result: "success",
        id: params.id,
      }),
    };

    it("should have all required properties", () => {
      expect(mockAction.id).toBe("action-1");
      expect(mockAction.label).toBe("Test Action");
      expect(mockAction.description).toBe("A test action");
      expect(mockAction.inputSchema).toBe(inputSchema);
      expect(mockAction.outputSchema).toBe(outputSchema);
      expect(mockAction.maxRetries).toBe(3);
      expect(mockAction.timeout).toBe(30000);
      expect(mockAction.handler).toBeDefined();
    });

    it("should execute handler correctly", async () => {
      const params = { id: "test-id", name: "Test Name" };
      const connection = {
        id: "connection-1",
        integrationId: "integration-1",
        connectorId: "test-connector",
        config: { token: "test-token" },
      };

      const result = await mockAction.handler(params, connection);
      expect(result).toEqual({
        result: "success",
        id: "test-id",
      });
    });
  });

  describe("Sync", () => {
    const outputSchema = z.object({
      data: z.array(z.any()),
    });

    const connectionConfig = z.object({
      token: z.string(),
    });

    const mockSync: Sync<typeof outputSchema, typeof connectionConfig> = {
      id: "sync-1",
      label: "Test Sync",
      description: "A test sync",
      schedule: "0 9 * * *",
      outputSchema,
      maxRetries: 3,
      timeout: 30000,
      handler: async () => ({ data: ["test"] }),
    };

    it("should have all required properties", () => {
      expect(mockSync.id).toBe("sync-1");
      expect(mockSync.label).toBe("Test Sync");
      expect(mockSync.description).toBe("A test sync");
      expect(mockSync.schedule).toBe("0 9 * * *");
      expect(mockSync.outputSchema).toBe(outputSchema);
      expect(mockSync.maxRetries).toBe(3);
      expect(mockSync.timeout).toBe(30000);
      expect(mockSync.handler).toBeDefined();
    });

    it("should execute handler correctly", async () => {
      const connection = {
        id: "connection-1",
        integrationId: "integration-1",
        connectorId: "test-connector",
        config: { token: "test-token" },
      };

      const result = await mockSync.handler(connection);
      expect(result).toEqual({ data: ["test"] });
    });
  });

  describe("Webhook", () => {
    const outputSchema = z.object({
      event: z.string(),
      data: z.any(),
    });

    const connectionConfig = z.object({
      token: z.string(),
    });

    const mockWebhook: Webhook<typeof outputSchema, typeof connectionConfig> = {
      id: "webhook-1",
      label: "Test Webhook",
      description: "A test webhook",
      outputSchema,
      handler: async () => ({
        event: "test-event",
        data: "test-data",
      }),
    };

    it("should have all required properties", () => {
      expect(mockWebhook.id).toBe("webhook-1");
      expect(mockWebhook.label).toBe("Test Webhook");
      expect(mockWebhook.description).toBe("A test webhook");
      expect(mockWebhook.outputSchema).toBe(outputSchema);
      expect(mockWebhook.handler).toBeDefined();
    });

    it("should execute handler correctly", async () => {
      const connection = {
        id: "connection-1",
        integrationId: "integration-1",
        connectorId: "test-connector",
        config: { token: "test-token" },
      };

      const result = await mockWebhook.handler(connection);
      expect(result).toEqual({
        event: "test-event",
        data: "test-data",
      });
    });
  });

  describe("Flow", () => {
    const mockFlow: Flow<any> = {
      name: "Test Flow",
      blocks: {
        "block-1": {
          run: async () => ({ result: "success" }),
        },
      },
      blockOrder: ["block-1"],
    };

    it("should have all required properties", () => {
      expect(mockFlow.name).toBe("Test Flow");
      expect(mockFlow.blocks).toHaveProperty("block-1");
      expect(mockFlow.blockOrder).toEqual(["block-1"]);
    });
  });

  describe("Type Safety", () => {
    it("should enforce type constraints", () => {
      const integrationConfig = z.object({
        apiKey: z.string(),
      });

      const connectionConfig = z.object({
        token: z.string(),
      });

      // This should compile without errors
      const connector: Connector<
        typeof integrationConfig,
        typeof connectionConfig
      > = {
        id: "test",
        name: "Test",
        author: "Test Author",
        logo: "logo.png",
        documentationUrl: "docs.com",
        version: "1.0.0",
        tags: [],
        categories: [],
        integrationConfig,
        connectionConfig,
        actions: {},
        syncs: {},
        webhooks: {},
        authenticationFlow: { name: "Flow", blocks: {}, blockOrder: [] },
        refresh: async () => ({ token: "new" }),
        createIntegration: (name, config) => ({
          id: "id",
          connectorId: "test",
          name,
          config,
        }),
      };

      expect(connector).toBeDefined();
    });
  });
});
