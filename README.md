# Databite SDK

A comprehensive TypeScript SDK for building, managing, and executing connectors to third-party APIs. The Databite SDK provides a powerful, type-safe way to create integrations with external services, manage data synchronization, and build robust data pipelines.

## 🏗️ Architecture

The Databite SDK is built as a modular monorepo with the following packages:

```
databite/
├── packages/
│   ├── ai/             # AI-powered connector generator
│   ├── build/          # Core SDK for building connectors
│   ├── connect/        # React components for UI integration
│   ├── connectors/     # Pre-built connector library
│   ├── engine/         # Data synchronization and execution engine
│   ├── flow/           # Flow engine for complex workflows
│   ├── types/          # Shared TypeScript types
│   └── example-webapp/ # Example Next.js web application
└── webapp/             # Example web application (legacy)
```

## 📦 Packages

### Core Packages

- **[@databite/build](./packages/build/)** - Core SDK for building connectors with fluent API
- **[@databite/flow](./packages/flow/)** - Flow engine for complex authentication and data workflows
- **[@databite/types](./packages/types/)** - Shared TypeScript types and interfaces

### Integration Packages

- **[@databite/ai](./packages/ai/)** - AI-powered connector generator from API documentation
- **[@databite/connectors](./packages/connectors/)** - Library of pre-built connectors (Slack, Trello, etc.)
- **[@databite/engine](./packages/engine/)** - Data synchronization and execution engine with scheduling
- **[@databite/connect](./packages/connect/)** - React components for UI integration

## 🚀 Quick Start

### Installation

```bash
# Install core packages
npm install @databite/build @databite/flow @databite/types

# Install additional packages as needed
npm install @databite/connectors @databite/sync @databite/connect
```

### Basic Usage

```typescript
import { createConnector, createFlow } from "@databite/build";
import { createFlow as createFlowBuilder } from "@databite/flow";

// Create a connector
const myConnector = createConnector()
  .withIdentity("my-service", "My Service")
  .withVersion("1.0.0")
  .withAuthor("Your Name")
  .withLogo("https://example.com/logo.png")
  .withDescription("Connector for My Service")
  .withAuthenticationFlow(
    createFlowBuilder("authenticate").httpBlock("auth", {
      url: "https://api.example.com/auth",
      method: "POST",
      body: { apiKey: "{{apiKey}}" },
    })
  )
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
- **🤖 AI Generator**: Automatically generate connectors from API documentation using AI
- **📊 Context Manager**: Manage execution contexts and state across flows
- **🎨 React Components**: Pre-built UI components for easy integration

## 📚 Documentation

### Package Documentation

- [**@databite/ai**](./packages/ai/README.md) - AI-powered connector generator
- [**@databite/build**](./packages/build/README.md) - Core connector builder SDK
- [**@databite/flow**](./packages/flow/README.md) - Flow engine for complex workflows
- [**@databite/types**](./packages/types/README.md) - Shared TypeScript types
- [**@databite/connectors**](./packages/connectors/README.md) - Pre-built connector library
- [**@databite/engine**](./packages/engine/README.md) - Data synchronization and execution engine
- [**@databite/connect**](./packages/connect/README.md) - React UI components

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
│   ├── ai/                       # AI-powered connector generator
│   │   ├── src/
│   │   │   ├── analyzer.ts       # AI documentation analysis
│   │   │   ├── crawler.ts        # Web documentation crawler
│   │   │   ├── file-generator.ts # Connector file generation
│   │   │   ├── generator.ts      # Main generation orchestrator
│   │   │   └── cli.ts            # Command-line interface
│   │   └── README.md
│   ├── build/                    # Core SDK
│   │   ├── src/
│   │   │   └── connector-builder/ # Builder implementation
│   │   ├── examples/             # Usage examples
│   │   └── README.md
│   ├── connect/                  # React components
│   │   ├── src/
│   │   │   ├── components/       # UI components
│   │   │   └── hooks/           # React hooks
│   │   └── README.md
│   ├── connectors/               # Pre-built connectors
│   │   ├── src/connectors/       # Connector implementations
│   │   └── README.md
│   ├── flow/                     # Flow engine
│   │   ├── src/flow-builder/     # Flow builder implementation
│   │   └── README.md
│   ├── engine/                   # Data synchronization and execution engine
│   │   ├── src/
│   │   │   ├── sync-engine/      # Sync engine implementation
│   │   │   ├── action-executer/  # Action execution logic
│   │   │   ├── rate-limiter/     # Rate limiting functionality
│   │   │   └── databite-engine/  # Main engine implementation
│   │   └── README.md
│   ├── types/                    # Shared types
│   │   ├── src/types/            # Type definitions
│   │   └── README.md
│   └── example-webapp/           # Example Next.js application
│       ├── app/                  # Next.js app directory
│       ├── components/           # Shared components
│       └── README.md
└── webapp/                       # Example application (legacy)
    ├── app/                      # Next.js app directory
    ├── components/               # Shared components
    └── db/                       # Database schema
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.databite.dev)
- 💬 [Discord Community](https://discord.gg/databite)
- 🐛 [Issue Tracker](https://github.com/DatabiteDev/databite/issues)
- 📧 [Email Support](mailto:hello@databite.dev)
