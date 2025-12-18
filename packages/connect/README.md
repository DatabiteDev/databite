# @databite/connect

React components and hooks for integrating Databite connectors into your web applications with seamless authentication flows.

## 📦 Project Structure

```
connect/
├── src/
│   ├── components/
│   │   ├── ConnectModal.tsx         # Main connection modal
│   │   ├── FlowStepRenderer.tsx     # Renders flow steps
│   │   ├── handle-oauth-flow.tsx    # OAuth flow handling
│   │   └── ui/                      # UI components
│   ├── lib/
│   │   └── utils.ts                 # Utility functions
│   ├── index.css                    # Styles
│   └── index.ts                     # Main exports
├── dist/                            # Compiled output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/connect
```

**Peer Dependencies:**

```bash
npm install react react-dom typescript
```

## 🎯 Overview

The `@databite/connect` package provides React components and hooks for ConnectModal, UI Components, Flow Integration, Type Safety, and Form Validation.

## 📚 API Reference

### Components

#### ConnectModal

A modal dialog for authenticating with connectors using flow-based UI.

```typescript
interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration<any>;
  onAuthSuccess: (
    integration: Integration<any>,
    connectionConfig: any
  ) => void | Promise<void>;
  onAuthError?: (error: Error) => void;
}
```

## 💡 Usage Example

```tsx
import React, { useState } from "react";
import { ConnectModal } from "@databite/connect";
import { Integration } from "@databite/types";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integration, setIntegration] = useState<Integration<any> | null>(null);

  const handleAuthSuccess = async (
    integration: Integration<any>,
    connectionConfig: any
  ) => {
    console.log("Authentication successful:", {
      integration,
      connectionConfig,
    });
    setIsModalOpen(false);
  };

  const handleAuthError = (error: Error) => {
    console.error("Authentication failed:", error);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Connect to Service
      </button>

      {integration && (
        <ConnectModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          integration={integration}
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
      )}
    </div>
  );
}
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
