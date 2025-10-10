import { z } from "zod";
import trello from "../connectors/trello";

describe("Trello Connector", () => {
  describe("Connector Definition", () => {
    it("should have correct identity", () => {
      expect(trello.id).toBe("trello");
      expect(trello.name).toBe("Trello");
    });

    it("should have correct metadata", () => {
      expect(trello.version).toBe("1.0.0");
      expect(trello.author).toBe("Databite Team");
      expect(trello.logo).toBe("https://trello.com/favicon.ico");
      expect(trello.documentationUrl).toBe(
        "https://developer.atlassian.com/cloud/trello/"
      );
      expect(trello.description).toBe(
        "Trello connector for project management and task tracking"
      );
    });

    it("should have correct categories and tags", () => {
      expect(trello.categories).toContain("productivity");
      expect(trello.tags).toContain("project-management");
      expect(trello.tags).toContain("tasks");
      expect(trello.tags).toContain("productivity");
    });

    it("should have integration config schema", () => {
      expect(trello.integrationConfig).toBeDefined();

      // Test valid integration config (empty object for trello)
      const validConfig = {};

      expect(() => trello.integrationConfig.parse(validConfig)).not.toThrow();
    });

    it("should have connection config schema", () => {
      expect(trello.connectionConfig).toBeDefined();

      // Test valid connection config
      const validConfig = {
        apiKey: "test-api-key",
      };

      expect(() => trello.connectionConfig.parse(validConfig)).not.toThrow();
    });

    it("should validate integration config", () => {
      const validConfig = {};

      const invalidConfig = {
        apiKey: "test-api-key", // Should be empty object
      };

      expect(() => trello.integrationConfig.parse(validConfig)).not.toThrow();
      expect(() => trello.integrationConfig.parse(invalidConfig)).toThrow();
    });

    it("should validate connection config", () => {
      const validConfig = {
        apiKey: "test-api-key",
      };

      const invalidConfig = {
        // Missing apiKey
      };

      expect(() => trello.connectionConfig.parse(validConfig)).not.toThrow();
      expect(() => trello.connectionConfig.parse(invalidConfig)).toThrow();
    });
  });

  describe("Authentication Flow", () => {
    it("should have authentication flow", () => {
      expect(trello.authenticationFlow).toBeDefined();
      expect(trello.authenticationFlow?.name).toBe("trelloAuth");
    });

    it("should have flow blocks", () => {
      expect(trello.authenticationFlow?.blocks).toBeDefined();
    });
  });

  describe("Refresh Function", () => {
    it("should refresh connection", async () => {
      const mockConnection = {
        id: "test-connection",
        integrationId: "test-integration",
        connectorId: "trello",
        config: {
          apiKey: "test-api-key",
        },
      };

      const result = await trello.refresh?.(mockConnection);

      expect(result).toEqual({
        apiKey: "test-api-key",
      });
    });
  });

  describe("Create Integration", () => {
    it("should create integration with valid config", () => {
      const integration = trello.createIntegration("Test Integration", {});

      expect(integration.id).toBeDefined();
      expect(integration.connectorId).toBe("trello");
      expect(integration.name).toBe("Test Integration");
      expect(integration.config).toEqual({});
    });

    it("should generate unique integration IDs", () => {
      const integration1 = trello.createIntegration("Integration 1", {});

      const integration2 = trello.createIntegration("Integration 2", {});

      expect(integration1.id).not.toBe(integration2.id);
    });
  });

  describe("Actions", () => {
    it("should have actions object", () => {
      expect(trello.actions).toBeDefined();
      expect(typeof trello.actions).toBe("object");
    });
  });

  describe("Syncs", () => {
    it("should have syncs object", () => {
      expect(trello.syncs).toBeDefined();
      expect(typeof trello.syncs).toBe("object");
    });
  });

  describe("Webhooks", () => {
    it("should have webhooks object", () => {
      expect(trello.webhooks).toBeDefined();
      expect(typeof trello.webhooks).toBe("object");
    });
  });

  describe("Type Safety", () => {
    it("should enforce type constraints", () => {
      // Test that the connector has the correct type structure
      expect(typeof trello.id).toBe("string");
      expect(typeof trello.name).toBe("string");
      expect(typeof trello.version).toBe("string");
      expect(typeof trello.author).toBe("string");
      expect(typeof trello.logo).toBe("string");
      expect(typeof trello.documentationUrl).toBe("string");
      expect(typeof trello.description).toBe("string");
      expect(Array.isArray(trello.tags)).toBe(true);
      expect(Array.isArray(trello.categories)).toBe(true);
      expect(typeof trello.actions).toBe("object");
      expect(typeof trello.syncs).toBe("object");
      expect(typeof trello.webhooks).toBe("object");
      expect(typeof trello.authenticationFlow).toBe("object");
      expect(typeof trello.refresh).toBe("function");
      expect(typeof trello.createIntegration).toBe("function");
    });
  });

  describe("Schema Validation", () => {
    it("should validate integration config schema", () => {
      const TrelloIntegrationConfigSchema = z.object({});

      const validData = {};

      const invalidData = {
        apiKey: "test-api-key", // Should be empty object
      };

      expect(() =>
        TrelloIntegrationConfigSchema.parse(validData)
      ).not.toThrow();
      expect(() => TrelloIntegrationConfigSchema.parse(invalidData)).toThrow();
    });

    it("should validate connection config schema", () => {
      const TrelloConnectionConfigSchema = z.object({
        apiKey: z.string(),
      });

      const validData = {
        apiKey: "test-api-key",
      };

      const invalidData = {
        apiKey: 123, // Should be string
      };

      expect(() => TrelloConnectionConfigSchema.parse(validData)).not.toThrow();
      expect(() => TrelloConnectionConfigSchema.parse(invalidData)).toThrow();
    });
  });
});
