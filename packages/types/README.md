# @databite/types

Shared TypeScript types and interfaces for the Databite SDK ecosystem.

## 📦 Package Structure

```
types/
├── src/
│   ├── types/
│   │   ├── connector-types.ts    # Connector-related types
│   │   ├── flow-types.ts         # Flow-related types
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

## 💡 Usage Examples

### Basic Type Usage

```typescript
import {
  Connector,
  Integration,
  Connection,
  ConnectionStatus,
} from "@databite/types";
import { z } from "zod";

// Define configuration schemas
const integrationConfig = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url(),
});

const connectionConfig = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

// Type a connector
type MyConnector = Connector<typeof integrationConfig, typeof connectionConfig>;

// Type an integration
type MyIntegration = Integration<typeof integrationConfig>;

// Type a connection
type MyConnection = Connection<typeof connectionConfig>;
```

### Flow Type Usage

```typescript
import { Flow, FlowBlock, Connection } from "@databite/types";

// Define flow context type
interface FlowContext {
  userId: string;
  apiKey: string;
}

// Define flow block types
type FetchUserBlock = FlowBlock<
  FlowContext,
  { user: any },
  typeof connectionConfig
>;
type ProcessUserBlock = FlowBlock<
  FlowContext & { user: any },
  { processedUser: any },
  typeof connectionConfig
>;

// Type a complete flow
type UserFlow = Flow<
  typeof connectionConfig,
  {
    fetchUser: FetchUserBlock;
    processUser: ProcessUserBlock;
  }
>;
```

### Action Type Usage

```typescript
import { Action, Sync } from "@databite/types";
import { z } from "zod";

// Define input/output schemas
const getUserInputSchema = z.object({
  id: z.string(),
});

const getUserOutputSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

// Type an action
type GetUserAction = Action<
  typeof getUserInputSchema,
  typeof getUserOutputSchema,
  typeof connectionConfig
>;

// Type a sync
const syncOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  })
);

type UserSync = Sync<typeof syncOutputSchema, typeof connectionConfig>;
```

### Generic Type Helpers

```typescript
import { Connector, Integration, Connection } from "@databite/types";

// Extract configuration types from connectors
type ExtractIntegrationConfig<T> = T extends Connector<infer U, any>
  ? U
  : never;
type ExtractConnectionConfig<T> = T extends Connector<any, infer U> ? U : never;

// Example usage
type MyConnector = Connector<typeof integrationConfig, typeof connectionConfig>;
type MyIntegrationConfig = ExtractIntegrationConfig<MyConnector>;
type MyConnectionConfig = ExtractConnectionConfig<MyConnector>;
```

### Utility Types

```typescript
import { Action, Sync } from "@databite/types";

// Extract handler parameter types
type ActionParams<T> = T extends Action<infer U, any, any> ? z.infer<U> : never;
type ActionResult<T> = T extends Action<any, infer U, any> ? z.infer<U> : never;

// Extract sync result types
type SyncResult<T> = T extends Sync<infer U, any> ? z.infer<U>[] : never;

// Example usage
type GetUserAction = Action<
  typeof getUserInputSchema,
  typeof getUserOutputSchema,
  typeof connectionConfig
>;
type GetUserParams = ActionParams<GetUserAction>; // { id: string }
type GetUserResult = ActionResult<GetUserAction>; // { user: { id: string, name: string, email: string } }
```

## 🔧 Advanced Type Patterns

### Conditional Types

```typescript
// Conditional type based on connection status
type ConnectionData<T extends ConnectionStatus> =
  T extends ConnectionStatus.ACTIVE
    ? { data: any; lastSync: Date }
    : T extends ConnectionStatus.ERROR
    ? { error: string; lastAttempt: Date }
    : { status: T };

// Usage
type ActiveConnectionData = ConnectionData<ConnectionStatus.ACTIVE>;
type ErrorConnectionData = ConnectionData<ConnectionStatus.ERROR>;
```

### Mapped Types

```typescript
// Create a type that maps action names to their result types
type ActionResults<T extends Record<string, Action<any, any, any>>> = {
  [K in keyof T]: ActionResult<T[K]>;
};

// Usage
type MyConnectorActions = {
  getUser: GetUserAction;
  createUser: CreateUserAction;
};

type MyActionResults = ActionResults<MyConnectorActions>;
// { getUser: GetUserResult, createUser: CreateUserResult }
```

### Template Literal Types

```typescript
// Create event type names
type SyncEvent<T extends string> = `sync.${T}`;

// Usage
type UserSyncEvent = SyncEvent<"user.synced">; // "sync.user.synced"
type OrderSyncEvent = SyncEvent<"order.synced">; // "sync.order.synced"
```

## 🎨 Best Practices

### 1. Use Strict Type Definitions

```typescript
// Good - specific types
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

// Avoid - loose types
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});
```

### 2. Leverage Type Inference

```typescript
// Let TypeScript infer types when possible
const connector = createConnector()
  .withIntegrationConfig(
    z.object({
      apiKey: z.string(),
      baseUrl: z.string().url(),
    })
  )
  .build();

// TypeScript automatically infers the correct types
type InferredIntegrationConfig = z.infer<typeof connector.integrationConfig>;
```

### 3. Use Generic Constraints

```typescript
// Constrain generic types for better type safety
interface TypedConnector<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
> extends Connector<TIntegrationConfig, TConnectionConfig> {
  // Additional typed methods
  executeAction<T extends keyof this["actions"]>(
    actionName: T,
    params: ActionParams<this["actions"][T]>
  ): Promise<ActionResult<this["actions"][T]>>;
}
```

### 4. Create Type Guards

```typescript
// Type guard for connection status
function isActiveConnection(
  connection: Connection<any>
): connection is Connection<any> & { status: ConnectionStatus.ACTIVE } {
  return connection.status === ConnectionStatus.ACTIVE;
}

// Usage
if (isActiveConnection(connection)) {
  // TypeScript knows connection.status is ACTIVE
  console.log(connection.lastSyncAt); // Safe to access
}
```

## 🧪 Testing Types

### Type Testing with TypeScript

```typescript
// Test that types are correctly inferred
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test integration config type
type IntegrationConfigTest = AssertEqual<
  z.infer<typeof integrationConfig>,
  { apiKey: string; baseUrl: string }
>; // Should be true

// Test action parameter type
type ActionParamsTest = AssertEqual<
  ActionParams<GetUserAction>,
  { id: string }
>; // Should be true
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/flow](./packages/flow/) - Flow engine for complex workflows
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
