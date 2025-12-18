# @databite/connectors

A comprehensive library of pre-built connectors for popular third-party APIs, built with the Databite SDK.

## 📦 Project Structure

```
connectors/
├── src/
│   ├── connectors/
│   │   ├── index.ts                # Main export file for all connectors
│   │   └── slack/                  # Slack connector implementation
│   └── index.ts                    # Main package exports
├── dist/                           # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/connectors @databite/build @databite/types
```

**Peer Dependencies:**

```bash
npm install zod typescript
```

## 🎯 Overview

The `@databite/connectors` package provides ready-to-use connectors for popular services. Each connector includes authentication flow, connection management, type safety, and extensibility.

## 📚 API Reference

### Exported Connectors

#### slack

Pre-built Slack connector for workspace integration.

```typescript
import { slack } from "@databite/connectors";

const slackConnector = slack;
```

### Connector Array

All available connectors in an array.

```typescript
import { connectors } from "@databite/connectors";

const availableConnectors = connectors; // Array of all connectors
```

## 💡 Usage Example

```typescript
import { slack } from "@databite/connectors";

// Create an integration
const integration = slack.createIntegration("My Slack Integration", {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  redirectUri: process.env.SLACK_REDIRECT_URI!,
  scopes: ["chat:write", "channels:read"],
});

// Use the connector
const connector = slack;
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/server](./packages/server/) - RESTful API server

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
