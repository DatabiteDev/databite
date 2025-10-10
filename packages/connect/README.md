# @databite/connect

React components and hooks for integrating Databite connectors into your web applications with seamless authentication flows.

## 📦 Package Structure

```
connect/
├── src/
│   ├── components/
│   │   ├── ConnectModal.tsx         # Main connection modal
│   │   └── ui/                      # UI components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── skeleton.tsx
│   ├── hooks/
│   │   └── useConnect.tsx           # Main connection hook
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
npm install @databite/connect @databite/flow @databite/connectors @databite/types
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
- **Flow Integration**: Seamless integration with @databite/flow for authentication
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

### useConnect Hook

A hook for managing connection modal state and providing easy access to open/close functionality.

```typescript
import { useConnect } from "@databite/connect";

interface UseConnectOptions {
  /** Callback when authentication is successful */
  onAuthSuccess: (
    integration: Integration<any>,
    connectionConfig: any
  ) => void | Promise<void>;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}

interface UseConnectReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** The currently selected integration */
  integration: Integration<any> | null;
  /** Open the connect modal with a specific integration */
  openConnect: (integration: Integration<any>) => void;
  /** Close the connect modal */
  closeConnect: () => void;
  /** Toggle the connect modal open/closed state */
  toggleConnect: () => void;
  /** Props to pass to the ConnectModal component */
  modalProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    integration: Integration<any> | null;
    onAuthSuccess: (
      integration: Integration<any>,
      connectionConfig: any
    ) => void | Promise<void>;
    onAuthError?: (error: Error) => void;
  };
}
```

#### Usage

```tsx
import React from "react";
import { useConnect, ConnectModal } from "@databite/connect";
import { Integration } from "@databite/types";

function MyComponent() {
  const { isOpen, openConnect, closeConnect, modalProps } = useConnect({
    onAuthSuccess: (integration, config) => {
      console.log("Connected!", integration.name, config);
      // Save connection to your backend
      saveConnection(integration.id, config);
    },
    onAuthError: (error) => {
      console.error("Connection failed:", error);
      // Show error message to user
    },
  });

  const handleConnect = () => {
    openConnect(myIntegration);
  };

  return (
    <div>
      <button onClick={handleConnect}>Connect to Service</button>
      <ConnectModal {...modalProps} />
    </div>
  );
}
```

## 💡 Usage Examples

### Basic Integration

```tsx
import React from "react";
import { ConnectModal, useConnect } from "@databite/connect";
import { Integration } from "@databite/types";

function ConnectorDashboard() {
  const { isOpen, openConnect, closeConnect, modalProps } = useConnect({
    onAuthSuccess: (integration, config) => {
      console.log("Connection established:", integration.name, config);
      // Save connection to your backend
      saveConnection(integration.id, config);
    },
    onAuthError: (error) => {
      console.error("Connection failed:", error);
      // Show error message to user
    },
  });

  const integrations = [
    {
      id: "slack",
      connectorId: "slack",
      name: "Slack",
      description: "Team communication platform",
      config: {
        clientId: process.env.REACT_APP_SLACK_CLIENT_ID,
        clientSecret: process.env.REACT_APP_SLACK_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/slack/callback`,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "trello",
      connectorId: "trello",
      name: "Trello",
      description: "Project management tool",
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <div key={integration.id} className="border rounded-lg p-6">
          <div className="w-12 h-12 mb-4 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <h3 className="text-lg font-semibold">{integration.name}</h3>
          <p className="text-gray-600 mb-4">{integration.description}</p>

          <button
            onClick={() => openConnect(integration)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect
          </button>
        </div>
      ))}

      <ConnectModal {...modalProps} />
    </div>
  );
}
```

### Advanced Connection Management

```tsx
import React, { useState, useEffect } from "react";
import { useConnect } from "@databite/connect";
import { Integration, Connection } from "@databite/types";

interface ConnectionManagerProps {
  integrations: Integration<any>[];
  onConnectionChange: (connection: Connection<any>) => void;
}

function ConnectionManager({
  integrations,
  onConnectionChange,
}: ConnectionManagerProps) {
  const [connections, setConnections] = useState<Map<string, Connection<any>>>(
    new Map()
  );
  const [activeIntegration, setActiveIntegration] =
    useState<Integration<any> | null>(null);

  const {
    isConnecting,
    isConnected,
    connectionConfig,
    error,
    connect,
    disconnect,
    clearError,
  } = useConnect({
    integration: activeIntegration!,
    onSuccess: (config) => {
      if (activeIntegration) {
        const connection: Connection<any> = {
          id: crypto.randomUUID(),
          integrationId: activeIntegration.id,
          config,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setConnections(
          (prev) => new Map(prev.set(activeIntegration.id, connection))
        );
        onConnectionChange(connection);
      }
    },
  });

  const handleConnect = async (integration: Integration<any>) => {
    setActiveIntegration(integration);
    clearError();

    try {
      await connect({
        // Connection configuration based on integration type
        ...(integration.id === "slack" && {
          clientId: process.env.REACT_APP_SLACK_CLIENT_ID,
          redirectUri: window.location.origin + "/auth/slack/callback",
        }),
        ...(integration.id === "trello" && {
          apiKey: process.env.REACT_APP_TRELLO_API_KEY,
          apiToken: process.env.REACT_APP_TRELLO_API_TOKEN,
        }),
      });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleDisconnect = (integrationId: string) => {
    setConnections((prev) => {
      const newConnections = new Map(prev);
      newConnections.delete(integrationId);
      return newConnections;
    });
    disconnect();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Connections</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const connection = connections.get(integration.id);
          const isActive = connection?.status === "active";

          return (
            <div
              key={integration.id}
              className={`border rounded-lg p-4 ${
                isActive ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <p className="text-sm text-gray-600">
                    {isActive ? "Connected" : "Not connected"}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {isActive ? (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      disabled={
                        isConnecting && activeIntegration?.id === integration.id
                      }
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isConnecting && activeIntegration?.id === integration.id
                        ? "Connecting..."
                        : "Connect"}
                    </button>
                  )}
                </div>
              </div>

              {error && activeIntegration?.id === integration.id && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Custom Authentication Form

```tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConnect } from "@databite/connect";
import { Integration } from "@databite/types";

const authSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  timeout: z.number().min(1000).max(60000).optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

interface CustomAuthFormProps {
  integration: Integration<any>;
  onSuccess: (config: AuthFormData) => void;
  onCancel: () => void;
}

function CustomAuthForm({
  integration,
  onSuccess,
  onCancel,
}: CustomAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const { isConnecting, error, connect, clearError } = useConnect({
    integration,
    onSuccess: (config) => {
      onSuccess(config);
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    clearError();
    try {
      await connect(data);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Connect to {integration.name}
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your API credentials to connect to {integration.name}.
        </p>
      </div>

      <div>
        <label
          htmlFor="apiKey"
          className="block text-sm font-medium text-gray-700"
        >
          API Key
        </label>
        <input
          {...register("apiKey")}
          type="password"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your API key"
        />
        {errors.apiKey && (
          <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="baseUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Base URL
        </label>
        <input
          {...register("baseUrl")}
          type="url"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://api.example.com"
        />
        {errors.baseUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.baseUrl.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="timeout"
          className="block text-sm font-medium text-gray-700"
        >
          Timeout (milliseconds)
        </label>
        <input
          {...register("timeout", { valueAsNumber: true })}
          type="number"
          min="1000"
          max="60000"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="30000"
        />
        {errors.timeout && (
          <p className="mt-1 text-sm text-red-600">{errors.timeout.message}</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error.message}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      </div>
    </form>
  );
}
```

## 🎨 Styling

The package uses Tailwind CSS for styling. Make sure to include Tailwind in your project:

```bash
npm install tailwindcss
```

### Custom Styling

You can customize the appearance by overriding CSS classes:

```css
/* Custom styles for ConnectModal */
.databite-connect-modal {
  @apply max-w-2xl;
}

.databite-connect-modal .databite-form {
  @apply space-y-4;
}

.databite-connect-modal .databite-input {
  @apply border-gray-300 focus:border-blue-500 focus:ring-blue-500;
}

.databite-connect-modal .databite-button {
  @apply bg-blue-500 hover:bg-blue-600 text-white;
}
```

## 🧪 Testing

### Component Testing

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectModal } from "@databite/connect";
import { Integration } from "@databite/types";

const mockIntegration: Integration<any> = {
  id: "test-integration",
  connectorId: "test-connector",
  name: "Test Integration",
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ConnectModal", () => {
  it("renders the modal when open", () => {
    render(
      <ConnectModal
        open={true}
        onOpenChange={jest.fn()}
        integration={mockIntegration}
        onAuthSuccess={jest.fn()}
      />
    );

    expect(screen.getByText("Connect to Test Integration")).toBeInTheDocument();
  });

  it("calls onAuthSuccess when authentication succeeds", async () => {
    const onAuthSuccess = jest.fn();

    render(
      <ConnectModal
        open={true}
        onOpenChange={jest.fn()}
        integration={mockIntegration}
        onAuthSuccess={onAuthSuccess}
      />
    );

    // Simulate form submission
    const submitButton = screen.getByText("Connect");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onAuthSuccess).toHaveBeenCalled();
    });
  });
});
```

### Hook Testing

```tsx
import { renderHook, act } from "@testing-library/react";
import { useConnect } from "@databite/connect";
import { Integration } from "@databite/types";

const mockIntegration: Integration<any> = {
  id: "test-integration",
  connectorId: "test-connector",
  name: "Test Integration",
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("useConnect", () => {
  it("should initialize with correct default values", () => {
    const { result } = renderHook(() =>
      useConnect({
        integration: mockIntegration,
      })
    );

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionConfig).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle connection success", async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useConnect({
        integration: mockIntegration,
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.connect({ apiKey: "test-key" });
    });

    expect(onSuccess).toHaveBeenCalledWith({ apiKey: "test-key" });
  });
});
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/flow](./packages/flow/) - Flow engine for complex workflows
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
