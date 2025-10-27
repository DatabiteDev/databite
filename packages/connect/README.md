# @databite/connect

React components and hooks for integrating Databite connectors into your web applications with seamless authentication flows.

## 📦 Package Structure

```
connect/
├── src/
│   ├── components/
│   │   ├── ConnectModal.tsx         # Main connection modal
|   |   ├── FlowStepRenderer.tsx     # Renders flow steps
│   │   └── ui/                      # UI components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── skeleton.tsx
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

The `@databite/connect` package provides React components and hooks for:

- **ConnectModal**: Modal dialog for connector authentication using flow-based UI
- **useConnect**: Hook for managing connection state and modal interactions
- **UI Components**: Pre-built form components with Tailwind CSS
- **Flow Integration**: Seamless flow rendering for authentication
- **Type Safety**: Full TypeScript support with automatic type inference
- **Form Validation**: Built-in form validation using react-hook-form and Zod

## 📚 Components

### ConnectModal

A modal dialog for authenticating with connectors using flow-based UI. The modal automatically renders the connector's authentication flow.

```typescript
import { ConnectModal } from "@databite/connect";
import { Integration } from "@databite/types";

interface ConnectModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Integration to display */
  integration: Integration<any>;
  /** Callback when authentication is successful */
  onAuthSuccess: (
    integration: Integration<any>,
    connectionConfig: any
  ) => void | Promise<void>;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}
```

#### Usage

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
    // Save connection to your backend
    await saveConnection(integration.id, connectionConfig);
    setIsModalOpen(false);
  };

  const handleAuthError = (error: Error) => {
    console.error("Authentication failed:", error);
    // Show error message to user
  };

  const handleConnect = (integration: Integration<any>) => {
    setIntegration(integration);
    setIsModalOpen(true);
  };

  return (
    <div>
      <button onClick={() => handleConnect(myIntegration)}>
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
