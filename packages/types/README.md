# @databite/types

Shared TypeScript types and interfaces for the Databite SDK ecosystem.

## 📦 Package Structure

```
types/
├── src/
│   ├── types/
│   │   ├── connector-types.ts    # Connector-related types
│   │   ├── flow-types.ts         # Flow-related types
│   │   ├── flow-session-types.ts # Flow session execution types
│   │   ├── connection-types.ts   # Connection-related types
│   │   ├── integration-types.ts  # Integration-related types
│   │   └── index.ts              # Type exports
│   ├── utils/
│   │   └── index.ts              # Utility types
│   └── index.ts                  # Main exports
├── dist/                         # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/types
```

**Peer Dependencies:**

```bash
npm install zod typescript
```

## 🎯 Overview

The `@databite/types` package provides comprehensive TypeScript type definitions for:

- **Connectors**: Templates for building API integrations
- **Integrations**: Instances of connectors with specific configurations
- **Connections**: Active connections to external services
- **Flows**: Workflow definitions for authentication and data processing
- **Actions/Syncs**: Core connector components

## 📚 Type Definitions

### Core Types

#### Connector

The main connector type that defines the blueprint for API integrations.

```typescript
interface Connector<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  id: string;
  name: string;
  version: string;
  author: string;
  logo: string;
  documentationUrl: string;
  description: string;
  tags: string[];
  categories: ConnectorCategory[];
  integrationConfig: TIntegrationConfig;
  connectionConfig: TConnectionConfig;
  authenticationFlow: Flow<TConnectionConfig>;
  refreshFlow: Flow<TConnectionConfig>;
  actions: Record<string, Action<any, any, TConnectionConfig>>;
  syncs: Record<string, Sync<any, TConnectionConfig>>;
  createIntegration: (
    name: string,
    config: z.infer<TIntegrationConfig>
  ) => Integration<TIntegrationConfig>;
}
```

#### Integration

An instance of a connector with specific configuration values.

```typescript
interface Integration<TConfig extends z.ZodType> {
  id: string;
  connectorId: string;
  name: string;
  config: z.infer<TConfig>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Connection

An active connection to an external service using an integration.

```typescript
interface Connection<TConfig extends z.ZodType> {
  id: string;
  integrationId: string;
  config: z.infer<TConfig>;
  status: ConnectionStatus;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Flow Types

#### Flow

Defines a workflow with blocks and execution order.

```typescript
interface Flow<
  TConnectionConfig extends z.ZodType,
  TBlocks = Record<string, FlowBlock<any, any, TConnectionConfig>>
> {
  name: string;
  blocks: TBlocks;
  blockOrder: string[];
}
```

#### FlowBlock

Individual block within a flow.

```typescript
interface FlowBlock<TInput, TOutput, TConnectionConfig extends z.ZodType> {
  run: (
    input: TInput,
    connection: Connection<TConnectionConfig>
  ) => Promise<TOutput>;
}
```

### Action Types

#### Action

Defines an action that can be executed on a connection.

```typescript
interface Action<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  id: string;
  label: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  maxRetries: number;
  timeout: number;
  handler: (
    params: z.infer<TInputSchema>,
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TOutputSchema>>;
}
```

#### Sync

Defines a data synchronization operation.

```typescript
interface Sync<
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  id: string;
  label: string;
  description: string;
  schedule: string;
  outputSchema: TOutputSchema;
  maxRetries: number;
  timeout: number;
  handler: (
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TOutputSchema>[]>;
}
```

### Enum Types

#### ConnectionStatus

Status of a connection.

```typescript
enum ConnectionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ERROR = "error",
  PENDING = "pending",
}
```

#### ConnectorCategory

Categories for organizing connectors.

```typescript
enum ConnectorCategory {
  CRM = "crm",
  MARKETING = "marketing",
  SALES = "sales",
  SUPPORT = "support",
  PRODUCTIVITY = "productivity",
  COMMUNICATION = "communication",
  ANALYTICS = "analytics",
  ECOMMERCE = "ecommerce",
  FINANCE = "finance",
  HR = "hr",
  DEVELOPMENT = "development",
  OTHER = "other",
}
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/flow](./packages/flow/) - Flow engine for complex workflows
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
