# @databite/connectors

A comprehensive library of pre-built connectors for popular third-party APIs, built with the Databite SDK.

## 📦 Package Structure

```
connectors/
├── src/
│   └── connectors/
│       ├── index.ts                # Main export file for all connectors
│       └── example-service/        # Example connector folder
│           ├── index.ts            # Connector definition (entry point)
│           ├── actions/            # Connector actions (e.g., API calls)
│           │   ├── sendMessage.ts
│           │   └── listChannels.ts
│           └── syncs/              # Data synchronization handlers
│               ├── syncUsers.ts
│               └── syncMessages.ts
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

The `@databite/connectors` package provides ready-to-use connectors for popular services.

Each connector includes:

- **Authentication Flow**: Built-in authentication flows
- **Connection Management**: Automatic connection and refresh handling
- **Type Safety**: Full TypeScript support with Zod schemas
- **Extensibility**: Easy to extend with custom actions and syncs

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
