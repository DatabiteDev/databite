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

### Configuration

#### EngineConfig

Configuration options for the Databite engine.

```typescript
interface EngineConfig {
  connectors: Connector<any, any>[];
  connectionStore?: ConnectionStore;
}
```

#### ConnectionStore

Interface for connection storage implementations.

```typescript
interface ConnectionStore {
  create(connection: Connection<any>): Promise<Connection<any>>;
  read(connectionId: string): Promise<Connection<any> | undefined>;
  readAll(): Promise<PaginatedResponse<Connection<any>>>;
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
  readAll(): Promise<PaginatedResponse<Connection<any>>>;
  update(connection: Connection<any>): Promise<Connection<any>>
  delete(connectionId: string): Promise<void>
}
```

## 💡 Usage Example

```typescript
import { DatabiteEngine } from "@databite/engine";

const engine = new DatabiteEngine({
  connectors: [],
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
