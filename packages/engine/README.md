# @databite/engine

A powerful data synchronization and execution engine for managing recurring sync operations, action execution, and data synchronization with automatic scheduling and execution.

## 📦 Package Structure

```
engine/
├── src/
│   ├── databite-engine/
│   │   ├── engine.ts            # Main DatabiteEngine class
│   │   └── index.ts             # Public API exports
│   ├── sync-engine/
│   │   ├── engine.ts            # SyncEngine implementation
│   │   ├── types.ts             # Sync engine types
│   │   ├── adapters/            # Scheduler adapters
│   │   └── index.ts             # Public API exports
│   ├── action-executer/
│   │   └── action-executer.ts   # Action execution logic
│   ├── rate-limiter/
│   │   └── rate-limiter.ts      # Rate limiting functionality
│   ├── utils/
│   │   └── index.ts             # Utility functions
│   └── index.ts                 # Main exports
├── dist/                        # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/engine @databite/types @databite/connectors @databite/build
```

**Peer Dependencies:**

```bash
npm install zod typescript bullmq
```

## 🎯 Overview

The `@databite/engine` package provides a comprehensive synchronization and execution engine with:

- **Automatic Scheduling**: Built-in job scheduling and execution
- **Connection Management**: Automatic connection and integration management
- **Action Execution**: Execute connector actions with rate limiting
- **Provider Pattern**: Flexible data source integration
- **Error Handling**: Built-in retry logic and error recovery
- **Real-time Monitoring**: Job status and execution tracking
- **Rate Limiting**: Built-in rate limiting for API calls
- **Data Export**: Automatic data persistence and export

## 📚 API Reference

### Core Classes

#### DatabiteEngine

The main class for managing data synchronization and execution operations.

```typescript
import { DatabiteEngine } from "@databite/engine";

const engine = new DatabiteEngine({
  dataProvider: async () => ({ connections, integrations }),
  dataExporter: async ({ connections, integrations }) => ({
    success: true,
    error: null,
  }),
  schedulerAdapter: new BullMQAdapter(),
  minutesBetweenSyncs: 5,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
});
```

### Configuration

#### EngineConfig

Configuration options for the Databite engine.

```typescript
interface EngineConfig {
  customConnectors?: Connector<any, any>[];
  dataProvider?: DataProvider;
  dataExporter?: DataExporter;
  refreshInterval?: number; // in milliseconds, default 5 minutes
  schedulerAdapter: SchedulerAdapter;
  minutesBetweenSyncs: number;
}
```

#### Provider Types

```typescript
type DataProvider = () => Promise<{
  connections: Connection<any>[];
  integrations: Integration<any>[];
}>;

type DataExporter = ({
  connections,
  integrations,
}: {
  connections: Connection<any>[];
  integrations: Integration<any>[];
}) => Promise<{ success: boolean; error: string | null }>;
```

#### ExecutionResult

Result of executing a sync operation.

```typescript
interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}
```

#### ScheduledJob

Represents a scheduled sync job.

```typescript
interface ScheduledJob {
  id: string;
  connectionId: string;
  syncName: string;
  schedule: string;
  nextRun: Date;
  isActive: boolean;
}
```

### Core Methods

#### Connection Management

```typescript
// Add a connection
syncEngine.addConnection(connection: Connection<any>): void

// Get a connection by ID
syncEngine.getConnection(connectionId: string): Connection<any> | undefined

// Add an integration
syncEngine.addIntegration(integration: Integration<any>): void

// Get an integration by name
syncEngine.getIntegration(integrationId: string): Integration<any> | undefined

// Get a connector by ID
syncEngine.getConnector(connectorId: string): Connector<any, any> | undefined
```

#### Data Refresh

```typescript
// Refresh connections from provider
await syncEngine.refreshConnections(): Promise<void>

// Refresh integrations from provider
await syncEngine.refreshIntegrations(): Promise<void>

// Refresh all data
await syncEngine.refreshAllData(): Promise<void>
```

#### Job Scheduling

```typescript
// Schedule syncs for a connection
syncEngine.scheduleConnectionSyncs(connectionId: string): void

// Unschedule syncs for a connection
syncEngine.unscheduleConnectionSyncs(connectionId: string): void

// Pause a scheduled job
syncEngine.pauseJob(jobId: string): void

// Resume a scheduled job
syncEngine.resumeJob(jobId: string): void
```

#### Job Management

```typescript
// Get all scheduled jobs
syncEngine.getJobs(): ScheduledJob[]

// Get jobs for a specific connection
syncEngine.getJobsForConnection(connectionId: string): ScheduledJob[]

// Execute a sync manually
await syncEngine.executeSync(connectionId: string, syncName: string): Promise<ExecutionResult>

// Destroy the sync engine and clean up resources
syncEngine.destroy(): void
```

### Types

#### ScheduledJob

Represents a scheduled sync job.

```typescript
interface ScheduledJob {
  id: string;
  connectionId: string;
  syncName: string;
  schedule: string;
  nextRun: Date;
  isActive: boolean;
}
```

#### ExecutionResult

Result of executing a sync operation.

```typescript
interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}
```

## 💡 Usage Examples

### Basic Setup

```typescript
import { SyncEngine } from "@databite/sync";
import { Connection, Integration } from "@databite/types";

// Create data providers
const connectionsProvider = async (): Promise<Connection<any>[]> => {
  // Fetch connections from your database
  return await db.connections.findMany();
};

const integrationsProvider = async (): Promise<Integration<any>[]> => {
  // Fetch integrations from your database
  return await db.integrations.findMany();
};

// Initialize sync engine
const syncEngine = new SyncEngine({
  connectionsProvider,
  integrationsProvider,
  refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
});

// Start the engine
console.log("Sync engine started");
```

### Manual Connection Management

```typescript
import { SyncEngine } from "@databite/sync";
import { Connection, Integration } from "@databite/types";

const syncEngine = new SyncEngine();

// Add connections manually
const connection: Connection<any> = {
  id: "conn-1",
  integrationId: "integration-1",
  config: { accessToken: "token123" },
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

syncEngine.addConnection(connection);

// Add integration
const integration: Integration<any> = {
  id: "integration-1",
  connectorId: "slack",
  name: "My Slack Integration",
  config: { apiKey: "key123" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

syncEngine.addIntegration(integration);

// Schedule syncs for the connection
syncEngine.scheduleConnectionSyncs("conn-1");
```

### Custom Schedule Formats

The sync engine supports multiple schedule formats:

```typescript
// Interval format (minutes, hours, days)
const intervalSync = createSync({
  label: "Hourly Sync",
  schedule: "1h", // Every hour
  // ...
});

const dailySync = createSync({
  label: "Daily Sync",
  schedule: "1d", // Every day
  // ...
});

// Cron format
const cronSync = createSync({
  label: "Business Hours Sync",
  schedule: "0 9 * * 1-5", // 9 AM, Monday to Friday
  // ...
});

const midnightSync = createSync({
  label: "Midnight Sync",
  schedule: "0 0 * * *", // Daily at midnight
  // ...
});
```

### Error Handling and Monitoring

```typescript
import { SyncEngine } from "@databite/sync";

const syncEngine = new SyncEngine({
  connectionsProvider: async () => connections,
  integrationsProvider: async () => integrations,
});

// Monitor job execution
setInterval(() => {
  const jobs = syncEngine.getJobs();
  console.log(`Active jobs: ${jobs.filter((j) => j.isActive).length}`);

  jobs.forEach((job) => {
    console.log(`Job ${job.id}: next run at ${job.nextRun}`);
  });
}, 60000); // Check every minute

// Handle sync execution results
const result = await syncEngine.executeSync("conn-1", "syncUsers");

if (result.success) {
  console.log(`Sync completed in ${result.executionTime}ms`);
  console.log(`Data:`, result.data);
} else {
  console.error(`Sync failed: ${result.error}`);
}
```

### Advanced Configuration

```typescript
import { SyncEngine } from "@databite/sync";

class CustomSyncEngine extends SyncEngine {
  constructor() {
    super({
      connectionsProvider: this.fetchConnections.bind(this),
      integrationsProvider: this.fetchIntegrations.bind(this),
      refreshInterval: 2 * 60 * 1000, // 2 minutes
    });
  }

  private async fetchConnections() {
    // Custom connection fetching logic
    const connections = await this.database.query(`
      SELECT * FROM connections 
      WHERE status = 'active' 
      AND last_sync_at < NOW() - INTERVAL '1 hour'
    `);

    return connections.map(this.mapToConnection);
  }

  private async fetchIntegrations() {
    // Custom integration fetching logic
    return await this.database.query(`
      SELECT * FROM integrations 
      WHERE connector_id IN ('slack', 'trello', 'github')
    `);
  }

  private mapToConnection(row: any): Connection<any> {
    return {
      id: row.id,
      integrationId: row.integration_id,
      config: JSON.parse(row.config),
      status: row.status,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

const customSyncEngine = new CustomSyncEngine();
```

### Job Management

```typescript
import { SyncEngine } from "@databite/sync";

const syncEngine = new SyncEngine({
  connectionsProvider: async () => connections,
  integrationsProvider: async () => integrations,
});

// Get all jobs
const allJobs = syncEngine.getJobs();
console.log(`Total jobs: ${allJobs.length}`);

// Get jobs for a specific connection
const connectionJobs = syncEngine.getJobsForConnection("conn-1");
console.log(`Jobs for connection: ${connectionJobs.length}`);

// Pause a specific job
const job = allJobs.find(
  (j) => j.connectionId === "conn-1" && j.syncName === "syncUsers"
);
if (job) {
  syncEngine.pauseJob(job.id);
  console.log(`Paused job: ${job.id}`);
}

// Resume the job later
setTimeout(() => {
  syncEngine.resumeJob(job.id);
  console.log(`Resumed job: ${job.id}`);
}, 300000); // Resume after 5 minutes
```

### Cleanup and Shutdown

```typescript
import { SyncEngine } from "@databite/sync";

const syncEngine = new SyncEngine({
  connectionsProvider: async () => connections,
  integrationsProvider: async () => integrations,
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down sync engine...");

  // Stop all scheduled jobs
  syncEngine.destroy();

  console.log("Sync engine stopped");
  process.exit(0);
});

// Or manual cleanup
setTimeout(() => {
  syncEngine.destroy();
  console.log("Sync engine destroyed");
}, 60000);
```

## 🔧 Advanced Usage

### Custom Schedule Parsing

```typescript
import { SyncEngine } from "@databite/sync";

class CustomSyncEngine extends SyncEngine {
  protected calculateNextRun(schedule: string): Date {
    // Custom schedule parsing
    if (schedule.startsWith("every-")) {
      const interval = schedule.replace("every-", "");
      return this.parseCustomInterval(interval);
    }

    // Fall back to default parsing
    return super.calculateNextRun(schedule);
  }

  private parseCustomInterval(interval: string): Date {
    const now = new Date();

    switch (interval) {
      case "business-hour":
        // Next business hour (9 AM - 5 PM)
        const nextBusinessHour = new Date(now);
        nextBusinessHour.setHours(9, 0, 0, 0);

        if (nextBusinessHour <= now || now.getHours() >= 17) {
          nextBusinessHour.setDate(nextBusinessHour.getDate() + 1);
        }

        return nextBusinessHour;

      case "weekend":
        // Next weekend
        const nextWeekend = new Date(now);
        const daysUntilSaturday = (6 - now.getDay()) % 7;
        nextWeekend.setDate(now.getDate() + daysUntilSaturday);
        nextWeekend.setHours(9, 0, 0, 0);

        return nextWeekend;

      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // Default: 1 hour
    }
  }
}
```

### Integration with External Schedulers

```typescript
import { SyncEngine } from "@databite/sync";
import cron from "node-cron";

class ExternalSchedulerSyncEngine extends SyncEngine {
  private cronJobs = new Map<string, cron.ScheduledTask>();

  scheduleConnectionSyncs(connectionId: string): void {
    super.scheduleConnectionSyncs(connectionId);

    // Also schedule with external cron library
    const connection = this.getConnection(connectionId);
    if (!connection) return;

    const integration = this.getIntegration(connection.integrationId);
    if (!integration) return;

    const connector = this.getConnector(integration.connectorId);
    if (!connector) return;

    // Schedule each sync with external cron
    for (const [syncName, sync] of Object.entries(connector.syncs)) {
      const jobId = `${connectionId}-${syncName}`;
      const schedule = (sync as any).schedule;

      if (this.isCronFormat(schedule)) {
        const cronJob = cron.schedule(schedule, () => {
          this.executeSync(connectionId, syncName);
        });

        this.cronJobs.set(jobId, cronJob);
      }
    }
  }

  private isCronFormat(schedule: string): boolean {
    // Check if schedule is in cron format
    return schedule.includes(" ") && schedule.split(" ").length >= 5;
  }

  destroy(): void {
    super.destroy();

    // Stop all cron jobs
    for (const cronJob of this.cronJobs.values()) {
      cronJob.stop();
    }
    this.cronJobs.clear();
  }
}
```

## 🎨 Best Practices

### 1. Use Appropriate Refresh Intervals

```typescript
// For frequently changing data
const frequentSyncEngine = new SyncEngine({
  refreshInterval: 1 * 60 * 1000, // 1 minute
});

// For stable data
const stableSyncEngine = new SyncEngine({
  refreshInterval: 15 * 60 * 1000, // 15 minutes
});
```

### 2. Implement Proper Error Handling

```typescript
const syncEngine = new SyncEngine({
  connectionsProvider: async () => {
    try {
      return await fetchConnections();
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      return []; // Return empty array on error
    }
  },
});
```

### 3. Monitor Job Health

```typescript
class MonitoredSyncEngine extends SyncEngine {
  private jobStats = new Map<
    string,
    { success: number; failure: number; lastRun: Date }
  >();

  async executeSync(
    connectionId: string,
    syncName: string
  ): Promise<ExecutionResult> {
    const result = await super.executeSync(connectionId, syncName);

    // Update statistics
    const jobId = `${connectionId}-${syncName}`;
    const stats = this.jobStats.get(jobId) || {
      success: 0,
      failure: 0,
      lastRun: new Date(),
    };

    if (result.success) {
      stats.success++;
    } else {
      stats.failure++;
    }

    stats.lastRun = new Date();
    this.jobStats.set(jobId, stats);

    return result;
  }

  getJobStats() {
    return Object.fromEntries(this.jobStats);
  }
}
```

### 4. Use Connection Pooling

```typescript
class PooledSyncEngine extends SyncEngine {
  private connectionPool = new Map<string, any>();

  async executeSync(
    connectionId: string,
    syncName: string
  ): Promise<ExecutionResult> {
    const connection = this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Get or create connection pool entry
    let poolEntry = this.connectionPool.get(connectionId);
    if (!poolEntry) {
      poolEntry = await this.createConnectionPoolEntry(connection);
      this.connectionPool.set(connectionId, poolEntry);
    }

    // Use pooled connection for sync
    return this.executeSyncWithPool(poolEntry, syncName);
  }

  private async createConnectionPoolEntry(connection: Connection<any>) {
    // Create connection pool entry
    return {
      connection,
      client: await this.createClient(connection),
      lastUsed: new Date(),
    };
  }
}
```

## 🧪 Testing

### Unit Testing

```typescript
import { SyncEngine } from "@databite/sync";

describe("SyncEngine", () => {
  let syncEngine: SyncEngine;

  beforeEach(() => {
    syncEngine = new SyncEngine({
      connectionsProvider: async () => mockConnections,
      integrationsProvider: async () => mockIntegrations,
    });
  });

  afterEach(() => {
    syncEngine.destroy();
  });

  it("should schedule connection syncs", () => {
    syncEngine.addConnection(mockConnection);
    syncEngine.addIntegration(mockIntegration);

    syncEngine.scheduleConnectionSyncs(mockConnection.id);

    const jobs = syncEngine.getJobsForConnection(mockConnection.id);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("should execute sync successfully", async () => {
    const result = await syncEngine.executeSync("conn-1", "syncUsers");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.executionTime).toBeGreaterThan(0);
  });
});
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
