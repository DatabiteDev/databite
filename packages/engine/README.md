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
│   ├── flow-manager/
│   │   └── flow-session-manager.ts  # Flow session management
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

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
