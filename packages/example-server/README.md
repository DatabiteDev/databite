# Example Server

A complete example showing how to set up and run a Databite server with Express.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Or with pnpm
pnpm install
```

### Configuration

Create a `.env.local` file in the root directory:

```bash
# Slack Integration
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:3001/auth/slack/callback
```

### Run the Server

```bash
# Start the development server
npm run dev

# Or with pnpm
pnpm dev
```

The server will start on `http://localhost:3001`.

## 📋 API Endpoints

Once the server is running, you can access:

- `GET /api/health` - Health check
- `GET /api/status` - Server status with statistics
- `GET /api/connectors` - List all connectors
- `GET /api/integrations` - List all integrations
- `GET /api/connections` - List all connections
- `POST /api/flows/start` - Start a flow session
- `POST /api/flows/:sessionId/step` - Execute a flow step

## 💡 Example Usage

### Check Server Health

```bash
curl http://localhost:3001/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Server Status

```bash
curl http://localhost:3001/api/status
```

Response:

```json
{
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "stats": {
    "connectors": 1,
    "integrations": 1,
    "connections": 0,
    "scheduledJobs": 0
  }
}
```

### List Integrations

```bash
curl http://localhost:3001/api/integrations
```

## 🏗️ Project Structure

```
example-server/
├── src/
│   └── index.ts      # Main server setup
├── .env.local        # Environment variables (create this)
├── package.json
└── README.md
```

## 🔧 Customization

You can customize the server by:

1. Adding more integrations
2. Modifying the server configuration
3. Adding custom middleware
4. Implementing authentication
5. Adding custom endpoints

See `src/index.ts` for the server setup and customization options.

## 📚 Learn More

- [@databite/server Documentation](../server/README.md)
- [@databite/engine Documentation](../engine/README.md)
- [@databite/connectors Documentation](../connectors/README.md)
- [Main README](../../README.md)

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
