import { z } from "zod";
import slack from "../connectors/slack";

describe("Slack Connector", () => {
  describe("Connector Definition", () => {
    it("should have correct identity", () => {
      expect(slack.id).toBe("slack");
      expect(slack.name).toBe("Slack");
    });

    it("should have correct metadata", () => {
      expect(slack.version).toBe("1.0.0");
      expect(slack.author).toBe("Databite Team");
      expect(slack.logo).toBe("https://slack.com/img/icons/app-57.png");
      expect(slack.documentationUrl).toBe("https://api.slack.com");
      expect(slack.description).toBe(
        "Slack connector for messaging and team communication"
      );
    });

    it("should have correct categories and tags", () => {
      expect(slack.categories).toContain("communication");
      expect(slack.tags).toContain("messaging");
      expect(slack.tags).toContain("team");
      expect(slack.tags).toContain("communication");
    });

    it("should have integration config schema", () => {
      expect(slack.integrationConfig).toBeDefined();

      // Test valid integration config
      const validConfig = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      };

      expect(() => slack.integrationConfig.parse(validConfig)).not.toThrow();
    });

    it("should have connection config schema", () => {
      expect(slack.connectionConfig).toBeDefined();

      // Test valid connection config
      const validConfig = {
        accessToken: "xoxb-test-token",
        refreshToken: "refresh-token",
      };

      expect(() => slack.connectionConfig.parse(validConfig)).not.toThrow();
    });

    it("should validate integration config", () => {
      const validConfig = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      };

      const invalidConfig = {
        clientId: "test-client-id",
        // Missing required fields
      };

      expect(() => slack.integrationConfig.parse(validConfig)).not.toThrow();
      expect(() => slack.integrationConfig.parse(invalidConfig)).toThrow();
    });

    it("should validate connection config", () => {
      const validConfig = {
        accessToken: "xoxb-test-token",
        refreshToken: "refresh-token",
      };

      const invalidConfig = {
        accessToken: "xoxb-test-token",
        // Missing refreshToken
      };

      expect(() => slack.connectionConfig.parse(validConfig)).not.toThrow();
      expect(() => slack.connectionConfig.parse(invalidConfig)).toThrow();
    });
  });

  describe("Authentication Flow", () => {
    it("should have authentication flow", () => {
      expect(slack.authenticationFlow).toBeDefined();
      expect(slack.authenticationFlow?.name).toBe("slackAuth");
    });

    it("should have flow blocks", () => {
      expect(slack.authenticationFlow?.blocks).toBeDefined();
    });
  });

  describe("Refresh Function", () => {
    it("should refresh connection", async () => {
      const mockConnection = {
        id: "test-connection",
        integrationId: "test-integration",
        connectorId: "slack",
        config: {
          accessToken: "old-token",
          refreshToken: "refresh-token",
        },
      };

      const result = await slack.refresh?.(mockConnection);

      expect(result).toEqual({
        accessToken: "old-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("Create Integration", () => {
    it("should create integration with valid config", () => {
      const integration = slack.createIntegration("Test Integration", {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      });

      expect(integration.id).toBeDefined();
      expect(integration.connectorId).toBe("slack");
      expect(integration.name).toBe("Test Integration");
      expect(integration.config).toEqual({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      });
    });

    it("should generate unique integration IDs", () => {
      const integration1 = slack.createIntegration("Integration 1", {
        clientId: "client-1",
        clientSecret: "secret-1",
        redirectUri: "https://example.com/callback",
      });

      const integration2 = slack.createIntegration("Integration 2", {
        clientId: "client-2",
        clientSecret: "secret-2",
        redirectUri: "https://example.com/callback",
      });

      expect(integration1.id).not.toBe(integration2.id);
    });
  });

  describe("Actions", () => {
    it("should have actions object", () => {
      expect(slack.actions).toBeDefined();
      expect(typeof slack.actions).toBe("object");
    });
  });

  describe("Syncs", () => {
    it("should have syncs object", () => {
      expect(slack.syncs).toBeDefined();
      expect(typeof slack.syncs).toBe("object");
    });
  });

  describe("Webhooks", () => {
    it("should have webhooks object", () => {
      expect(slack.webhooks).toBeDefined();
      expect(typeof slack.webhooks).toBe("object");
    });
  });

  describe("Type Safety", () => {
    it("should enforce type constraints", () => {
      // Test that the connector has the correct type structure
      expect(typeof slack.id).toBe("string");
      expect(typeof slack.name).toBe("string");
      expect(typeof slack.version).toBe("string");
      expect(typeof slack.author).toBe("string");
      expect(typeof slack.logo).toBe("string");
      expect(typeof slack.documentationUrl).toBe("string");
      expect(typeof slack.description).toBe("string");
      expect(Array.isArray(slack.tags)).toBe(true);
      expect(Array.isArray(slack.categories)).toBe(true);
      expect(typeof slack.actions).toBe("object");
      expect(typeof slack.syncs).toBe("object");
      expect(typeof slack.webhooks).toBe("object");
      expect(typeof slack.authenticationFlow).toBe("object");
      expect(typeof slack.refresh).toBe("function");
      expect(typeof slack.createIntegration).toBe("function");
    });
  });

  describe("Schema Validation", () => {
    it("should validate integration config schema", () => {
      const SlackIntegrationConfigSchema = z.object({
        clientId: z.string(),
        clientSecret: z.string(),
        redirectUri: z.string(),
      });

      const validData = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      };

      const invalidData = {
        clientId: 123, // Should be string
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
      };

      expect(() => SlackIntegrationConfigSchema.parse(validData)).not.toThrow();
      expect(() => SlackIntegrationConfigSchema.parse(invalidData)).toThrow();
    });

    it("should validate connection config schema", () => {
      const SlackConnectionConfigSchema = z.object({
        accessToken: z.string(),
        refreshToken: z.string(),
      });

      const validData = {
        accessToken: "xoxb-test-token",
        refreshToken: "refresh-token",
      };

      const invalidData = {
        accessToken: "xoxb-test-token",
        refreshToken: 123, // Should be string
      };

      expect(() => SlackConnectionConfigSchema.parse(validData)).not.toThrow();
      expect(() => SlackConnectionConfigSchema.parse(invalidData)).toThrow();
    });
  });
});
