# @databite/server

Express server with RESTful API endpoints for managing connectors, integrations, connections, flows, and sync operations.

## 📦 Package Structure

```
server/
├── src/
│   ├── server.ts         # Main DatabiteServer class
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

**Peer Dependencies:**

```bash
npm install express typescript
```

## 🎯 Overview

The `@databite/server` package provides a ready-to-use Express server with comprehensive RESTful API endpoints for:

- **Connectors**: List and retrieve connector information
- **Integrations**: Manage integration instances
- **Connections**: Manage active connections
  destroy
- **Flows**: Start, execute, and manage flow sessions
- **Sync Operations**: Manage scheduled sync jobs
- **Actions**: Execute connector actions

## 📚 API Reference

### Core Classes

#### DatabiteServer

The main server class that sets up Express with all the necessary endpoints.

```typescript
import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";

const server = new DatabiteServer({
  port: 3001,
  engineConfig: {
    schedulerAdapter: new InMemoryAdapter(),
    minutesBetweenSyncs: 10,
  },
});

await server.start();
```

### Configuration

#### ServerConfig

Configuration options for the Databite server.

```typescript
interface ServerConfig {
  port: number;
  engineConfig: EngineConfig;
}
```

### API Endpoints

#### Connectors

```typescript
GET    /api/connectors        # List all connectors
GET    /api/connectors/:id    # Get connector by ID
```

#### Integrations

```typescript
GET    /api/integrations      # List all integrations
GET    /api/integrations/:id  # Get integration by ID
```

#### Connections

```typescript
GET    /api/connections       # List all connections
GET    /api/connections/:id   # Get connection by ID
POST   /api/connections       # Add a connection
DELETE /api/connections/:id   # Remove a connection
```

#### Flows

```typescript
POST   /api/flows/start                    # Chunk a flow session
POST   /api/flows/:sessionId/step          # Execute a flow step
GET    /api/flows/:sessionId               # Get flow session details
DELETE /api/flows/:sessionId               # Delete a flow session
```

#### Sync Operations

```typescript
GET    /api/sync/jobs                      # List all scheduled jobs
GET    /api/sync/jobs/:connectionId        # Get jobs for a connection
POST   /api/sync/execute/:connectionId/:syncName  # Execute a sync
```

#### Actions

```typescript
GET    /api/actions/:connectorId           # Get actions for a connector
POST   /api/actions/execute/:connectionId/:actionName  # Execute an action
```

#### Health

```typescript
GET    /api/health          # Health check endpoint
GET    /api/status          # Server status with statistics
```

## 💡 Usage Examples

### Basic Server Setup

```typescript
import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";
import { slack } from "@databite/connectors";

async function main() {
  // Create server instance
  const server = new DatabiteServer({
    port: 3001,
    engineConfig: {
      schedulerAdapter: new InMemoryAdapter(),
      minutesBetweenSyncs: 10,
    },
  });

  // Add integrations
  await server.addIntegration(
    slack.createIntegration("Slack Integration", {
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      redirectUri: process.env.SLACK_REDIRECT_URI!,
      scopes: ["chat:write", "channels:read"],
    })
  );

  // Start the server
  await server.start();

  console.log("Server running at http://localhost:3001");
}

main().catch(console.error);
```

### Making API Requests

#### List Connectors

```bash
curl http://localhost:3001/api/connectors
```

#### Add a Connection

```bash
curl -X POST http://localhost:3001/api/connections \
  -H "Content-Type: application/json" \
  -d '{
    "id": "conn-1",
    "integrationId": "int-1",
    "config": {
      "accessToken": "token123"
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }'
```

#### Execute an Action

```bash
curl -X POST http://localhost:3001/api/actions/execute/conn-1/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#general",
    "text": "Hello from API!"
  }'
```

#### Start a Flow Session

```bash
curl -X POST http://localhost:3001/api/flows/start \
  -H "Content-Type: application/json" \
  -d '{
    "integrationId": "int-1"
  }'
```

### Error Handling

All endpoints return proper HTTP status codes and error messages:

- **200**: Success
- **400**: Bad Request (missing required parameters, validation errors)
- **404**: Resource not found
- **500**: Internal server error

Example error response:

```json
{
  "error": "Connection not found"
}
```

## 🔗 Related Packages

- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/build](./packages/build/) - Core connector builder SDK

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
