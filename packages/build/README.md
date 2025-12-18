# @databite/build

A comprehensive SDK for building connectors to third-party APIs with a fluent, type-safe API.

## 📦 Project Structure

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

The `@databite/build` package provides the core functionality for creating connectors using a fluent API. It includes ConnectorBuilder for defining connectors, Action & Sync Creators, Type Safety, Validation, Retry Logic, Flow Builder, and Connector Validation.

## 📚 API Reference

### Core Classes

#### ConnectorBuilder

The main class for building connectors with a fluent API.

```typescript
class ConnectorBuilder<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  withIdentity(id: string, name: string): this
  withVersion(version: string): this
  withAuthor(author: string): this
  withLogo(logo: string): this
  withDocumentationUrl(url: string): this
  withDescription(description: string): this
  withIntegrationConfig(config: TIntegrationConfig): this
  withConnectionConfig(config: TConnectionConfig): this
  withAuthenticationFlow(flow: Flow<TConnectionConfig>): this
  withRefresh(refresh: (connection: Connection<TConnectionConfig>) => Promise<z.infer<TConnectionConfig>>): this
  withActions(actions: Record<string, Action>): this
  withSyncs(syncs: Record<string, Sync>): this
  withTags(...tags: string[]): this
  withCategories(...categories: ConnectorCategory[]): this
  build(): Connector<TIntegrationConfig, TConnectionConfig>
}
```

### Helper Functions

#### createConnector

Creates a new ConnectorBuilder instance.

```typescript
function createConnector(): ConnectorBuilder<any, any>
```

#### createAction

Creates an action with automatic retry logic and timeout handling.

```typescript
function createAction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(config: {
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
}): Action<TInputSchema, TOutputSchema, TConnectionConfig>
```

#### createSync

Creates a sync operation for data synchronization.

```typescript
function createSync<
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(config: {
  label: string;
  description: string;
  schedule: string;
  outputSchema: TOutputSchema;
  maxRetries: number;
  timeout: number;
  handler: (
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TOutputSchema>[]>;
}): Sync<TOutputSchema, TConnectionConfig>
```

## 💡 Usage Example

```typescript
import { createConnector, createAction, createSync } from "@databite/build";
import { z } from "zod";

const connector = createConnector()
  .withIdentity("my-service", "My Service")
  .withVersion("1.0.0")
  .withAuthor("Your Name")
  .withLogo("https://example.com/logo.png")
  .withDescription("Connector for My Service API")
  .withIntegrationConfig(z.object({ apiKey: z.string() }))
  .withConnectionConfig(z.object({ accessToken: z.string() }))
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
  .build();
```

## 🔗 Related Packages

- [@databite/server](./packages/server/) - RESTful API server
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
