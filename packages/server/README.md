# @databite/server

Express server with RESTful API endpoints for managing connectors, integrations, connections, flows, and sync operations. Built with comprehensive security features for self-hosted deployments.

## 📦 Package Structure

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

**Required Dependencies:**

```bash
npm install express helmet express-rate-limit typescript
```

## 🎯 Overview

The `@databite/server` package provides a ready-to-use Express server with comprehensive RESTful API endpoints for:

- **Connectors**: List and retrieve connector information
- **Integrations**: Manage integration instances
- **Connections**: Manage active connections
- **Flows**: Start, execute, and manage flow sessions
- **Sync Operations**: Manage scheduled sync jobs
- **Actions**: Execute connector actions

### 🔒 Built-in Security Features

- **Rate Limiting**: Prevent abuse with configurable per-IP limits
- **CORS Protection**: Control which domains can access your server
- **Security Headers**: Helmet middleware for HTTP security headers
- **IP Filtering**: Whitelist/blacklist specific IP addresses
- **Input Sanitization**: Automatic XSS prevention
- **Request Validation**: Custom validation logic support
- **Request Size Limits**: Prevent memory exhaustion attacks

## 📚 API Reference

### Core Classes

#### DatabiteServer

The main server class that sets up Express with all the necessary endpoints and security middleware.

```typescript
import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";

const server = new DatabiteServer({
  port: 3001,
  engineConfig: {
    schedulerAdapter: new InMemoryAdapter(),
    minutesBetweenSyncs: 10,
  },
  security: {
    // Optional security configuration
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Max requests per window
    },
    allowedOrigins: ["http://localhost:3000"],
    enableHelmet: true,
    enableRateLimit: true,
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
  security?: SecurityConfig;
}
```

#### SecurityConfig

Optional security configuration for protecting your server.

```typescript
interface SecurityConfig {
  // Rate limiting configuration
  rateLimit?: {
    windowMs?: number; // Time window in milliseconds
    max?: number; // Max requests per window
    message?: string; // Custom error message
  };

  // CORS origin whitelist (supports wildcards)
  allowedOrigins?: string[];

  // Maximum request body size
  requestSizeLimit?: string;

  // Enable/disable security features
  enableHelmet?: boolean;
  enableRateLimit?: boolean;

  // IP filtering
  ipWhitelist?: string[];
  ipBlacklist?: string[];

  // Custom request validation
  requestValidator?: (req: Request) => boolean | Promise<boolean>;
}
```

### API Endpoints

All endpoints include rate limiting and security protections:

#### Connectors (Moderate Rate Limit: 30 req/min)

```typescript
GET    /api/connectors        # List all connectors
GET    /api/connectors/:id    # Get connector by ID
```

#### Integrations (Moderate Rate Limit: 30 req/min)

```typescript
GET    /api/integrations      # List all integrations
GET    /api/integrations/:id  # Get integration by ID
```

#### Connections

```typescript
GET    /api/connections       # List all connections (30 req/min)
GET    /api/connections/:id   # Get connection by ID (30 req/min)
POST   /api/connections       # Add a connection (5 req/min)
DELETE /api/connections/:id   # Remove a connection (5 req/min)
```

#### Flows

```typescript
POST   /api/flows/start                    # Start a flow session (5 req/min)
POST   /api/flows/:sessionId/step          # Execute a flow step (30 req/min)
GET    /api/flows/:sessionId               # Get flow session details (30 req/min)
DELETE /api/flows/:sessionId               # Delete a flow session (5 req/min)
```

#### Sync Operations

```typescript
GET    /api/sync/jobs                      # List all scheduled jobs (30 req/min)
GET    /api/sync/jobs/:connectionId        # Get jobs for a connection (30 req/min)
POST   /api/sync/execute/:connectionId/:syncName  # Execute a sync (5 req/min)
```

#### Actions

```typescript
GET    /api/actions/:connectorId           # Get actions for a connector (30 req/min)
POST   /api/actions/execute/:connectionId/:actionName  # Execute an action (5 req/min)
```

#### Health (No Rate Limit)

```typescript
GET    /api/health          # Health check endpoint
GET    /api/status          # Server status with statistics (30 req/min)
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

### Server with Security Configuration

```typescript
import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";

const server = new DatabiteServer({
  port: 3001,
  engineConfig: {
    schedulerAdapter: new InMemoryAdapter(),
    minutesBetweenSyncs: 10,
  },
  security: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Max 100 requests per window per IP
      message: "Too many requests, please try again later.",
    },

    // CORS - Allow specific origins (supports wildcards)
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:*", // Any localhost port
      "https://yourdomain.com",
      "https://*.yourdomain.com", // Any subdomain
    ],

    // Request size limit
    requestSizeLimit: "10mb",

    // Enable security features
    enableHelmet: true,
    enableRateLimit: true,

    // Optional: IP whitelist (empty = allow all)
    ipWhitelist: [],

    // Optional: IP blacklist
    ipBlacklist: [
      // '192.168.1.100', // Block specific IPs
    ],

    // Optional: Custom request validation
    requestValidator: async (req) => {
      // Validate API version
      const apiVersion = req.headers["x-api-version"];
      if (apiVersion && apiVersion !== "1.0") {
        return false;
      }

      // Block suspicious user agents
      const userAgent = req.headers["user-agent"] || "";
      if (userAgent.toLowerCase().includes("malicious-bot")) {
        return false;
      }

      return true;
    },
  },
});

await server.start();
```

### Environment-Based Configuration

```typescript
const isDevelopment = process.env.NODE_ENV === "development";

const server = new DatabiteServer({
  port: 3001,
  engineConfig: {
    schedulerAdapter: new InMemoryAdapter(),
    minutesBetweenSyncs: 10,
  },
  security: {
    // Looser limits in development
    rateLimit: {
      max: isDevelopment ? 1000 : 100,
    },
    allowedOrigins: isDevelopment
      ? ["http://localhost:*"]
      : ["https://yourdomain.com"],
    enableRateLimit: !isDevelopment,
    ipWhitelist: process.env.ALLOWED_IPS?.split(",") || [],
  },
});
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
- **201**: Created (for POST requests)
- **400**: Bad Request (missing required parameters, validation errors)
- **403**: Forbidden (IP blocked, CORS violation)
- **404**: Resource not found
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal server error

Example error response:

```json
{
  "error": "Connection not found"
}
```

Rate limit error response:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## 🔒 Security Best Practices

### For Self-Hosted Deployments

1. **Always use HTTPS in production** - Deploy behind a reverse proxy like nginx
2. **Restrict CORS origins** - Only allow your client application domains
3. **Configure appropriate rate limits** - Adjust based on your use case
4. **Use IP whitelisting when possible** - Limit access to known IPs
5. **Monitor logs** - Watch for unusual patterns or attacks
6. **Keep dependencies updated** - Regularly update security packages
7. **Use environment variables** - Never hardcode sensitive configuration

### Network-Level Protection

Deploy behind a reverse proxy for additional security:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Additional rate limiting at nginx level
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### Security Headers Included

The server automatically adds these security headers (via Helmet):

- `Content-Security-Policy`: Prevents XSS attacks
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `Strict-Transport-Security`: Enforces HTTPS
- `X-DNS-Prefetch-Control`: Controls DNS prefetching

## 🔗 Related Packages

- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/build](./packages/build/) - Core connector builder SDK

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
