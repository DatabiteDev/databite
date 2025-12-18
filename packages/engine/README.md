# @databite/engine

A powerful data synchronization and execution engine for managing recurring sync operations, action execution, and data synchronization with automatic scheduling and execution.

## 📦 Project Structure

```
engine/
├── src/
│   ├── databite-engine/
│   │   ├── engine.ts            # Main DatabiteEngine class
│   │   ├── types.ts             # Engine types and interfaces
│   │   ├── in-memory-connection-store.ts # In-memory connection storage
│   │   └── index.ts             # Public API exports
│   ├── sync-engine/
│   │   ├── engine.ts            # SyncEngine implementation
│   │   ├── types.ts             # Sync engine types
│   │   ├── scheduler/           # Sync Jobs Scheduler
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
npm install @databite/engine
```

## 🎯 Overview

The `@databite/engine` package provides a comprehensive synchronization and execution engine with automatic scheduling, connection management, action execution, provider pattern, error handling, real-time monitoring, rate limiting, and data export.

## 📚 API Reference

### Core Classes

#### DatabiteEngine

The main class for managing data synchronization and execution operations.

```typescript
class DatabiteEngine {
  constructor(config: EngineConfig)
  addConnection(connection: Connection<any>): Promise<Connection<any>>
  addIntegration(integration: Integration<any>): Promise<void>
  getConnections(): Promise<Connection<any>[]>
  getConnection(connectionId: string): Promise<Connection<any> | undefined>
  removeConnection(connectionId: string): Promise<void>
  getIntegrations(): Integration<any>[]
  getConnectors(): Connector<any, any>[]
  scheduleConnectionSyncs(connectionId: string): Promise<void>
  unscheduleConnectionSyncs(connectionId: string): Promise<void>
  executeSync(connectionId: string, syncName: string): Promise<ExecutionResult>
  getScheduledJobs(): Promise<ScheduledJob[]>
  getConnectionJobs(connectionId: string): Promise<ScheduledJob[]>
  executeAction(connectionId: string, actionName: string, params: any): Promise<{ success: boolean; data?: any; error?: string; executionTime: number }>
  startFlowSession(integrationId: string): Promise<any>
  executeFlowStep(sessionId: string, userInput?: any): Promise<any>
  getFlowSession(sessionId: string): Promise<any>
  deleteFlowSession(sessionId: string): void
  destroy(): Promise<void>
}
```

### Configuration

#### EngineConfig

Configuration options for the Databite engine.

```typescript
interface EngineConfig {
  connectors: Connector<any, any>[];
  connectionStore?: ConnectionStore;
  minutesBetweenSyncs: number;
}
```

#### ConnectionStore

Interface for connection storage implementations.

```typescript
interface ConnectionStore {
  create(connection: Connection<any>): Promise<Connection<any>>;
  read(connectionId: string): Promise<Connection<any> | undefined>;
  readAll(): Promise<Connection<any>[]>;
  update(connection: Connection<any>): Promise<Connection<any>>;
  delete(connectionId: string): Promise<void>;
}
```

#### InMemoryConnectionStore

In-memory implementation of ConnectionStore.

```typescript
class InMemoryConnectionStore implements ConnectionStore {
  create(connection: Connection<any>): Promise<Connection<any>>
  read(connectionId: string): Promise<Connection<any> | undefined>
  readAll(): Promise<Connection<any>[]>
  update(connection: Connection<any>): Promise<Connection<any>>
  delete(connectionId: string): Promise<void>
}
```

### Types

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
  schedule: number;
  nextRun?: Date;
  isActive: boolean;
  lastRun?: Date;
  lastResult?: ExecutionResult;
}
```

## 💡 Usage Example

```typescript
import { DatabiteEngine } from "@databite/engine";

const engine = new DatabiteEngine({
  connectors: [],
  minutesBetweenSyncs: 5,
});

// Add an integration
await engine.addIntegration(integration);

// Add a connection
await engine.addConnection(connection);
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/server](./packages/server/) - RESTful API server

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
