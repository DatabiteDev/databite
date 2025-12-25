# @databite/server

Express server with RESTful API endpoints for managing connectors, integrations, connections, flows, and sync operations. Built with comprehensive security features for self-hosted deployments.

## 📦 Project Structure

```
server/
├── src/
│   ├── server.ts         # Main DatabiteServer class
│   ├── security.ts       # Security middleware and configuration
│   ├── utils.ts          # Utility functions
│   └── index.ts          # Public API exports
├── dist/                 # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/server @databite/engine @databite/types
```

## 🎯 Overview

The `@databite/server` package provides a ready-to-use Express server with RESTful API endpoints for connectors, integrations, connections, flows, sync operations, and actions. Includes built-in security features like rate limiting, CORS protection, security headers, IP filtering, input sanitization, request validation, and request size limits.

## 📚 API Reference

### Core Classes

#### DatabiteServer

The main server class that sets up Express with all the necessary endpoints and security middleware.

```typescript
class DatabiteServer {
  constructor(config: ServerConfig)
  addIntegration(integration: Integration<any>): Promise<void>
}
```

### Configuration

#### ServerConfig

Configuration options for the Databite server.

```typescript
interface ServerConfig {
  port: number;
  engineConfig: EngineConfig;
  security?: SecurityConfig;
}
```

#### SecurityConfig

Optional security configuration for protecting your server.

```typescript
interface SecurityConfig {
  rateLimit?: {
    windowMs?: number;
    max?: number;
    message?: string;
  };
  allowedOrigins?: string[];
  requestSizeLimit?: string;
  enableHelmet?: boolean;
  enableRateLimit?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  requestValidator?: (req: Request) => boolean | Promise<boolean>;
}
```

## 💡 Usage Example

```typescript
import { DatabiteServer } from "@databite/server";

const server = new DatabiteServer({
  port: 3001,
  engineConfig: {
    connectors: [],
  },
});

// Add an integration
await server.addIntegration(integration);
```

## 🔗 Related Packages

- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/build](./packages/build/) - Core connector builder SDK

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
