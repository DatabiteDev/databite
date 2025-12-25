# @databite/types

Shared TypeScript types and interfaces for the Databite SDK ecosystem.

## 📦 Project Structure

```
types/
├── src/
│   ├── types/
│   │   ├── connector-types.ts    # Connector-related types
│   │   ├── flow-types.ts         # Flow-related types
│   │   ├── flow-session-types.ts # Flow session execution types
│   │   ├── connection-types.ts   # Connection-related types
│   │   ├── integration-types.ts  # Integration-related types
│   │   └── index.ts              # Type exports
│   ├── utils/
│   │   └── index.ts              # Utility types
│   └── index.ts                  # Main exports
├── dist/                         # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/types
```

**Peer Dependencies:**

```bash
npm install zod typescript
```

## 🎯 Overview

The `@databite/types` package provides comprehensive TypeScript type definitions for the Databite SDK ecosystem, including types for connectors, integrations, connections, flows, actions, and syncs.

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/server](./packages/server/) - RESTful API server

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
