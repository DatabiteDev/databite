# Databite SDK

<div align="center">
  <img src="docs/images/hero.png" alt="Databite SDK Hero" width="800" />
</div>

A comprehensive TypeScript SDK for building, managing, and executing connectors to third-party APIs. The Databite SDK provides a powerful, type-safe way to create integrations with external services, manage data synchronization, and build robust data pipelines.

## 🏗️ Architecture

The Databite SDK is built as a modular monorepo with the following packages:

```
databite/
├── packages/
│   ├── build/          # Core SDK for building connectors
│   ├── connect/        # React components for UI integration
│   ├── connectors/     # Pre-built connector library
│   ├── engine/         # Data synchronization and execution engine
│   ├── server/         # Express server with API endpoints
│   ├── types/          # Shared TypeScript types
│   ├── example-webapp/ # Example Next.js web application
│   └── example-server/ # Example Express server
```

## 📦 Packages

### Core Packages

- **[@databite/build](./packages/build/)** - Core SDK for building connectors with fluent API
- **[@databite/types](./packages/types/)** - Shared TypeScript types and interfaces

### Integration Packages

- **[@databite/connectors](./packages/connectors/)** - Library of pre-built connectors (Slack, Trello, etc.)
- **[@databite/engine](./packages/engine/)** - Data synchronization and execution engine with scheduling
- **[@databite/connect](./packages/connect/)** - React components for UI integration
- **[@databite/server](./packages/server/)** - Express server with API endpoints for connectors

## 🚀 Quick Start

### Installation

```bash
# Install core packages
npm install @databite/build @databite/types

# Install additional packages as needed
npm install @databite/connectors @databite/engine @databite/connect @databite/server
```

### Basic Usage

```typescript
import { createConnector, createAction } from "@databite/build";
import { z } from "zod";

// Create a connector
const myConnector = createConnector()
  .withIdentity("my-service", "My Service")
  .withVersion("1.0.0")
  .withAuthor("Your Name")
  .withLogo("https://example.com/logo.png")
  .withDescription("Connector for My Service")
  .withActions({
    getData: createAction({
      label: "Get Data",
      description: "Fetch data from the service",
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({ data: z.any() }),
      handler: async (params, connection) => {
        // Your implementation
        return { data: { id: params.id } };
      },
    }),
  })
  .build();
```

## 🎯 Key Concepts

### Three-Tier Hierarchy

1. **Connector** - A template/blueprint that defines what properties and configurations are available
2. **Integration** - An instance of a connector where specific values have been filled in for the properties and configs
3. **Connection** - When someone actually uses an integration to connect to a service

### Core Features

- **🔧 Connector Builder**: Fluent API for defining connectors with full TypeScript support
- **⚡ Flow Engine**: Execute complex authentication and data workflows with automatic type inference
- **🔄 Sync Engine**: Handle recurring data synchronization with cron/interval scheduling
- **📊 Context Manager**: Manage execution contexts and state across flows
- **🎨 React Components**: Pre-built UI components for easy integration
- **🚀 Express Server**: Ready-to-use Express server with RESTful API endpoints

## 📚 Documentation

### Package Documentation

- [**@databite/build**](./packages/build/README.md) - Core connector builder SDK
- [**@databite/types**](./packages/types/README.md) - Shared TypeScript types
- [**@databite/connectors**](./packages/connectors/README.md) - Pre-built connector library
- [**@databite/engine**](./packages/engine/README.md) - Data synchronization and execution engine
- [**@databite/connect**](./packages/connect/README.md) - React UI components
- [**@databite/server**](./packages/server/README.md) - Express server with API endpoints

## 🛠️ Development

### Prerequisites

- Node.js >= 16.0.0
- TypeScript >= 4.5.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/DatabiteDev/databite.git
cd databite

# Install dependencies
pnpm install

# Build all packages
pnpm run build:all

# Run tests
pnpm test
```

### Project Structure

```
databite/
├── packages/
│   ├── build/                    # Core SDK
│   │   ├── src/
│   │   │   └── connector-builder/ # Builder implementation
│   │   ├── examples/             # Usage examples
│   │   └── README.md
│   ├── connect/                  # React components
│   │   ├── src/
│   │   │   ├── components/       # UI components
│   │   │   └── lib/             # Utility functions
│   │   └── README.md
│   ├── connectors/               # Pre-built connectors
│   │   ├── src/connectors/       # Connector implementations
│   │   └── README.md
│   ├── engine/                   # Data synchronization and execution engine
│   │   ├── src/
│   │   │   ├── sync-engine/      # Sync engine implementation
│   │   │   ├── action-executer/  # Action execution logic
│   │   │   ├── rate-limiter/     # Rate limiting functionality
│   │   │   ├── databite-engine/  # Main engine implementation
│   │   │   └── flow-manager/     # Flow session management
│   │   └── README.md
│   ├── server/                   # Express server
│   │   ├── src/
│   │   │   ├── server.ts         # Main server implementation
│   │   │   └── utils.ts          # Utility functions
│   │   └── README.md
│   ├── types/                    # Shared types
│   │   ├── src/types/            # Type definitions
│   │   └── README.md
│   ├── example-webapp/           # Example Next.js application
│   │   ├── app/                  # Next.js app directory
│   │   ├── components/           # Shared components
│   │   └── README.md
│   └── example-server/           # Example Express server
│       ├── src/
│       │   └── index.ts          # Server setup example
│       └── README.md
```

## 🚀 Release Workflow

### Creating a Changeset

To document changes for a release:

```bash
# Create a changeset describing changes
pnpm changeset
```

### Publishing a Release

When ready to release:

```bash
# When ready to release:
pnpm release
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📋 Code of Conduct

This project adheres to a Code of Conduct to ensure a welcoming and inclusive environment for all contributors and community members. We are committed to providing a harassment-free experience for everyone, regardless of background, identity, or experience level.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community guidelines and expectations for participation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.databite.dev)
- 💬 [Discord Community](https://discord.gg/5HZXYMdNST)
- 🐛 [Issue Tracker](https://github.com/DatabiteDev/databite/issues)
- 📧 [Email Support](mailto:hello@databite.dev)
