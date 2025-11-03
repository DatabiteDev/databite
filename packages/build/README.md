# @databite/build

A comprehensive SDK for building connectors to third-party APIs with a fluent, type-safe API.

## 📦 Package Structure

```
build/
├── src/
│   ├── connector-builder/
│   │   ├── builder.ts          # Main ConnectorBuilder class
│   │   ├── flow-builder.ts     # Flow builder for authentication flows
│   │   ├── index.ts            # Public API exports
│   │   └── utils.ts            # Utility functions
│   └── index.ts                # Main package exports
├── dist/                       # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/build @databite/types
```

**Peer Dependencies:**

```bash
npm install zod typescript
```

## 🎯 Overview

The `@databite/build` package provides the core functionality for creating connectors using a fluent API. It includes:

- **ConnectorBuilder**: Fluent API for defining connectors
- **Action & Sync Creators**: Helper functions for creating connector components
- **Type Safety**: Full TypeScript support with automatic type inference
- **Validation**: Built-in validation using Zod schemas
- **Retry Logic**: Built-in retry and timeout handling
- **Flow Builder**: Built-in flow builder for authentication flows
- **Connector Validation**: Built-in validation for connector definitions

## 📚 API Reference

### Core Classes

#### ConnectorBuilder

The main class for building connectors with a fluent API.

```typescript
import { createConnector } from "@databite/build";
import { z } from "zod";

const connector = createConnector()
  .withIdentity("my-service", "My Service")
  .withVersion("1.0.0")
  .withAuthor("Your Name")
  .withLogo("https://example.com/logo.png")
  .withDescription("Connector for My Service")
  .build();
```

### Builder Methods

#### Identity & Metadata

```typescript
// Set connector identity
.withIdentity(id: string, name: string)

// Set version
.withVersion(version: string)

// Set author
.withAuthor(author: string)

// Set logo URL
.withLogo(logo: string)

// Set documentation URL
.withDocumentationUrl(url: string)

// Set description
.withDescription(description: string)
```

#### Configuration

```typescript
// Add integration configuration schema
.withIntegrationConfig(config: ZodSchema)

// Add connection configuration schema
.withConnectionConfig(config: ZodSchema)

// Add tags for categorization
.withTags(...tags: string[])

// Add categories
.withCategories(...categories: ConnectorCategory[])
```

#### Flows

```typescript
// Set authentication flow
.withAuthenticationFlow(flow: Flow<TConnectionConfig>)

// Set refresh function
.withRefresh(refresh: (connection: Connection<TConnectionConfig>) => Promise<z.infer<TConnectionConfig>>)
```

#### Actions & Syncs

```typescript
// Add actions
.withActions(actions: Record<string, Action>)

// Add syncs
.withSyncs(syncs: Record<string, Sync>)
```

### Helper Functions

#### createAction

Creates an action with automatic retry logic and timeout handling.

```typescript
import { createAction } from "@databite/build";
import { z } from "zod";

const action = createAction({
  label: "Get User",
  description: "Fetch user by ID",
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({
    user: z.object({ id: z.string(), name: z.string() }),
  }),
  maxRetries: 3,
  timeout: 30000,
  handler: async (params, connection) => {
    // Your implementation
    return { user: { id: params.id, name: "John Doe" } };
  },
});
```

#### createSync

Creates a sync operation for data synchronization.

```typescript
import { createSync } from "@databite/build";

const sync = createSync({
  label: "Sync Users",
  description: "Synchronize user data",
  schedule: "0 9 * * *", // Daily at 9 AM
  outputSchema: z.array(z.object({ id: z.string() })),
  maxRetries: 3,
  timeout: 60000,
  handler: async (connection) => {
    // Your sync implementation
    return [{ id: "1" }, { id: "2" }];
  },
});
```

## 💡 Usage Examples

### Basic Connector

```typescript
import { createConnector, createAction, createSync } from "@databite/build";
import { z } from "zod";

// Define configuration schemas
const integrationConfig = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url(),
});

const connectionConfig = z.object({
  userId: z.string(),
  accessToken: z.string(),
});

// Create the connector
const myConnector = createConnector()
  .withIdentity("my-service", "My Service")
  .withVersion("1.0.0")
  .withAuthor("Your Name")
  .withLogo("https://example.com/logo.png")
  .withDescription("Connector for My Service API")
  .withIntegrationConfig(integrationConfig)
  .withConnectionConfig(connectionConfig)
  .withActions({
    getUser: createAction({
      label: "Get User",
      description: "Fetch user information",
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({ user: z.any() }),
      handler: async (params, connection) => {
        const response = await fetch(
          `${connection.config.baseUrl}/users/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${connection.config.accessToken}`,
            },
          }
        );
        return { user: await response.json() };
      },
    }),
  })
  .withSyncs({
    syncUsers: createSync({
      label: "Sync Users",
      description: "Synchronize all users",
      schedule: "0 2 * * *", // Daily at 2 AM
      outputSchema: z.array(z.any()),
      handler: async (connection) => {
        const response = await fetch(`${connection.config.baseUrl}/users`, {
          headers: { Authorization: `Bearer ${connection.config.accessToken}` },
        });
        return await response.json();
      },
    }),
  })
  .withTags("api", "users", "saas")
  .build();
```

## 🔧 Configuration

### Integration Configuration

Define the schema for integration-level configuration:

```typescript
const integrationConfig = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  timeout: z.number().min(1000).max(60000).default(30000),
  retryAttempts: z.number().min(0).max(10).default(3),
});
```

### Connection Configuration

Define the schema for connection-level configuration:

```typescript
const connectionConfig = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  userId: z.string(),
  permissions: z.array(z.string()).optional(),
});
```

## 🎨 Best Practices

### 1. Use Descriptive Names

```typescript
// Good
.withIdentity("slack-api", "Slack API Integration")

// Avoid
.withIdentity("slack", "Slack")
```

### 2. Provide Clear Descriptions

```typescript
// Good
.withDescription("Connect to Slack workspace to send messages, manage channels, and sync user data")

// Avoid
.withDescription("Slack connector")
```

### 3. Use Appropriate Timeouts

```typescript
// For quick operations
const quickAction = createAction({
  timeout: 10000, // 10 seconds
  // ...
});

// For data-intensive operations
const dataSync = createSync({
  timeout: 300000, // 5 minutes
  // ...
});
```

## 🔗 Related Packages

- [@databite/server](./packages/server/) - Express server with API endpoints
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
