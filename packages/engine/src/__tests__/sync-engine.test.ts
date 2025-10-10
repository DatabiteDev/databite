import { SyncEngine } from "../databite-engine/engine";
import { Connection, Integration, Connector } from "@databite/types";
import { z } from "zod";

// Mock the connectors module
jest.mock("@databite/connectors", () => ({
  slack: {
    id: "slack",
    name: "Slack",
    version: "1.0.0",
    author: "Test Author",
    logo: "https://example.com/logo.png",
    documentationUrl: "https://example.com/docs",
    description: "Slack connector",
    integrationConfig: z.object({}),
    connectionConfig: z.object({ token: z.string() }),
    actions: {},
    syncs: {
      users: {
        id: "users-sync",
        label: "Sync Users",
        description: "Sync users from Slack",
        schedule: "0 9 * * *",
        outputSchema: z.object({ users: z.array(z.any()) }),
        maxRetries: 3,
        timeout: 30000,
        handler: jest.fn().mockResolvedValue([{ users: [] }]),
      },
    },
    webhooks: {},
    categories: ["communication"],
    tags: ["messaging"],
    createIntegration: jest.fn(),
  } as Connector<any, any>,
}));

describe("SyncEngine", () => {
  let syncEngine: SyncEngine;
  let mockConnectionsProvider: jest.Mock;
  let mockIntegrationsProvider: jest.Mock;

  const mockConnection: Connection<any> = {
    id: "connection-1",
    integrationId: "integration-1",
    connectorId: "slack",
    config: { token: "test-token" },
  };

  const mockIntegration: Integration<any> = {
    id: "integration-1",
    connectorId: "slack",
    name: "Slack Integration",
    config: { apiKey: "test-key" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionsProvider = jest.fn().mockResolvedValue([mockConnection]);
    mockIntegrationsProvider = jest.fn().mockResolvedValue([mockIntegration]);

    syncEngine = new SyncEngine({
      connectionsProvider: mockConnectionsProvider,
      integrationsProvider: mockIntegrationsProvider,
      refreshInterval: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    syncEngine.destroy();
  });

  describe("constructor", () => {
    it("should initialize with default configuration", () => {
      const engine = new SyncEngine();
      expect(engine).toBeDefined();
      engine.destroy();
    });

    it("should initialize with custom configuration", () => {
      const engine = new SyncEngine({
        connectionsProvider: mockConnectionsProvider,
        integrationsProvider: mockIntegrationsProvider,
        refreshInterval: 2000,
      });
      expect(engine).toBeDefined();
      engine.destroy();
    });
  });

  describe("addConnection", () => {
    it("should add a connection", () => {
      syncEngine.addConnection(mockConnection);
      const retrieved = syncEngine.getConnection(mockConnection.id);
      expect(retrieved).toBe(mockConnection);
    });
  });

  describe("addIntegration", () => {
    it("should add an integration", () => {
      syncEngine.addIntegration(mockIntegration);
      const retrieved = syncEngine.getIntegration(mockIntegration.id);
      expect(retrieved).toBe(mockIntegration);
    });
  });

  describe("getConnection", () => {
    it("should return connection by id", () => {
      syncEngine.addConnection(mockConnection);
      const retrieved = syncEngine.getConnection(mockConnection.id);
      expect(retrieved).toBe(mockConnection);
    });

    it("should return undefined for non-existent connection", () => {
      const retrieved = syncEngine.getConnection("non-existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("getIntegration", () => {
    it("should return integration by id", () => {
      syncEngine.addIntegration(mockIntegration);
      const retrieved = syncEngine.getIntegration(mockIntegration.id);
      expect(retrieved).toBe(mockIntegration);
    });

    it("should return undefined for non-existent integration", () => {
      const retrieved = syncEngine.getIntegration("non-existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("getConnector", () => {
    it("should return connector by id", () => {
      const connector = syncEngine.getConnector("slack");
      expect(connector).toBeDefined();
      expect(connector?.id).toBe("slack");
    });

    it("should return undefined for non-existent connector", () => {
      const connector = syncEngine.getConnector("non-existent");
      expect(connector).toBeUndefined();
    });
  });

  describe("refreshConnections", () => {
    it("should refresh connections from provider", async () => {
      await syncEngine.refreshConnections();
      expect(mockConnectionsProvider).toHaveBeenCalled();
    });

    it("should handle missing connections provider", async () => {
      const engine = new SyncEngine();
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await engine.refreshConnections();
      expect(consoleSpy).toHaveBeenCalledWith(
        "No connections provider configured"
      );

      consoleSpy.mockRestore();
      engine.destroy();
    });

    it("should handle provider errors", async () => {
      const errorProvider = jest
        .fn()
        .mockRejectedValue(new Error("Provider error"));
      const engine = new SyncEngine({ connectionsProvider: errorProvider });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await engine.refreshConnections();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to refresh connections:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      engine.destroy();
    });
  });

  describe("refreshIntegrations", () => {
    it("should refresh integrations from provider", async () => {
      await syncEngine.refreshIntegrations();
      expect(mockIntegrationsProvider).toHaveBeenCalled();
    });

    it("should handle missing integrations provider", async () => {
      const engine = new SyncEngine();
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await engine.refreshIntegrations();
      expect(consoleSpy).toHaveBeenCalledWith(
        "No integrations provider configured"
      );

      consoleSpy.mockRestore();
      engine.destroy();
    });
  });

  describe("refreshAllData", () => {
    it("should refresh both connections and integrations", async () => {
      await syncEngine.refreshAllData();
      expect(mockConnectionsProvider).toHaveBeenCalled();
      expect(mockIntegrationsProvider).toHaveBeenCalled();
    });
  });

  describe("scheduleConnectionSyncs", () => {
    beforeEach(() => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
    });

    it("should schedule syncs for a connection", () => {
      syncEngine.scheduleConnectionSyncs(mockConnection.id);
      const jobs = syncEngine.getJobsForConnection(mockConnection.id);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].connectionId).toBe(mockConnection.id);
      expect(jobs[0].syncName).toBe("users");
    });

    it("should throw error for non-existent connection", () => {
      expect(() => {
        syncEngine.scheduleConnectionSyncs("non-existent");
      }).toThrow("Connection 'non-existent' not found");
    });

    it("should throw error for non-existent integration", () => {
      const connectionWithoutIntegration = {
        ...mockConnection,
        integrationId: "non-existent",
      };
      syncEngine.addConnection(connectionWithoutIntegration);

      expect(() => {
        syncEngine.scheduleConnectionSyncs(connectionWithoutIntegration.id);
      }).toThrow("Integration 'non-existent' not found");
    });
  });

  describe("unscheduleConnectionSyncs", () => {
    beforeEach(() => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);
    });

    it("should unschedule syncs for a connection", () => {
      const initialJobs = syncEngine.getJobsForConnection(mockConnection.id);
      expect(initialJobs).toHaveLength(1);

      syncEngine.unscheduleConnectionSyncs(mockConnection.id);
      const remainingJobs = syncEngine.getJobsForConnection(mockConnection.id);
      expect(remainingJobs).toHaveLength(0);
    });
  });

  describe("pauseJob", () => {
    beforeEach(() => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);
    });

    it("should pause a job", () => {
      const jobs = syncEngine.getJobsForConnection(mockConnection.id);
      const jobId = jobs[0].id;

      syncEngine.pauseJob(jobId);
      const job = syncEngine.getJobs().find((j) => j.id === jobId);
      expect(job?.isActive).toBe(false);
    });
  });

  describe("resumeJob", () => {
    beforeEach(() => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);
    });

    it("should resume a job", () => {
      const jobs = syncEngine.getJobsForConnection(mockConnection.id);
      const jobId = jobs[0].id;

      // First pause the job
      syncEngine.pauseJob(jobId);
      let job = syncEngine.getJobs().find((j) => j.id === jobId);
      expect(job?.isActive).toBe(false);

      // Then resume it
      syncEngine.resumeJob(jobId);
      job = syncEngine.getJobs().find((j) => j.id === jobId);
      expect(job?.isActive).toBe(true);
    });
  });

  describe("getJobs", () => {
    it("should return all jobs", () => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);

      const jobs = syncEngine.getJobs();
      expect(jobs).toHaveLength(1);
    });
  });

  describe("getJobsForConnection", () => {
    it("should return jobs for a specific connection", () => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);

      const jobs = syncEngine.getJobsForConnection(mockConnection.id);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].connectionId).toBe(mockConnection.id);
    });
  });

  describe("executeSync", () => {
    beforeEach(() => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
    });

    it("should execute a sync successfully", async () => {
      const result = await syncEngine.executeSync(mockConnection.id, "users");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ users: [] }]);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle sync execution errors", async () => {
      // Mock a failing sync handler
      const mockConnector = syncEngine.getConnector("slack");
      if (mockConnector) {
        mockConnector.syncs.users.handler = jest
          .fn()
          .mockRejectedValue(new Error("Sync failed"));
      }

      const result = await syncEngine.executeSync(mockConnection.id, "users");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Sync failed");
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it("should throw error for non-existent connection", async () => {
      await expect(
        syncEngine.executeSync("non-existent", "users")
      ).rejects.toThrow("Connection 'non-existent' not found");
    });

    it("should throw error for non-existent sync", async () => {
      await expect(
        syncEngine.executeSync(mockConnection.id, "non-existent")
      ).rejects.toThrow("Sync 'non-existent' not found in connector 'slack'");
    });
  });

  describe("setRefreshInterval", () => {
    it("should update refresh interval", () => {
      syncEngine.setRefreshInterval(2000);
      // The interval change is internal, but we can test that it doesn't throw
      expect(() => syncEngine.setRefreshInterval(2000)).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("should clean up resources", () => {
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);
      syncEngine.scheduleConnectionSyncs(mockConnection.id);

      expect(() => syncEngine.destroy()).not.toThrow();
    });
  });

  describe("calculateNextRun", () => {
    it("should calculate next run for interval format", () => {
      // This tests the private method indirectly through scheduling
      syncEngine.addConnection(mockConnection);
      syncEngine.addIntegration(mockIntegration);

      // The calculateNextRun method is private, but we can test it indirectly
      // by checking that scheduling works with different formats
      expect(() => {
        syncEngine.scheduleConnectionSyncs(mockConnection.id);
      }).not.toThrow();
    });
  });
});
