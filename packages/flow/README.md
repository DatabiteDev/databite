# @databite/flow

A powerful React-based flow engine for building interactive workflows with automatic type inference, IDE autocomplete, and built-in UI components.

## 📦 Package Structure

```
flow/
├── src/
│   ├── flow-builder/
│   │   ├── flow-builder.tsx    # Main FlowBuilder class
│   │   └── index.ts            # Flow builder exports
│   ├── flow-execution/
│   │   ├── flow-execution.tsx  # React hooks and components
│   │   ├── flow-hydration.tsx  # Flow hydration utilities
│   │   └── index.ts            # Execution exports
│   ├── components/ui/          # Reusable UI components
│   │   ├── badge.tsx           # Badge component
│   │   ├── button.tsx          # Button component
│   │   ├── card.tsx           # Card component
│   │   ├── dialog.tsx         # Dialog component
│   │   ├── empty.tsx          # Empty state component
│   │   ├── form.tsx           # Form component
│   │   ├── input.tsx          # Input component
│   │   ├── label.tsx          # Label component
│   │   ├── select.tsx         # Select component
│   │   ├── skeleton.tsx       # Skeleton loader
│   │   └── switch.tsx         # Switch component
│   ├── __tests__/             # Test files
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── index.css              # Global styles
│   ├── index.ts               # Main exports
│   └── server.ts              # Server-side exports
├── dist/                       # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/flow @databite/types
```

**Peer Dependencies:**

```bash
npm install react react-dom zod typescript
```

**Additional Dependencies (included):**

The package includes the following UI component dependencies:

- `@radix-ui/react-dialog` - Dialog components
- `@radix-ui/react-label` - Label components
- `@radix-ui/react-select` - Select components
- `@radix-ui/react-slot` - Slot components
- `@radix-ui/react-switch` - Switch components
- `@hookform/resolvers` - Form validation
- `react-hook-form` - Form handling
- `class-variance-authority` - CSS class utilities
- `clsx` - Conditional class names
- `lucide-react` - Icons
- `tailwind-merge` - Tailwind CSS utilities
- `tailwindcss` - CSS framework

**Server-Side Support:**

The package supports both client and server-side usage with automatic exports:

- **Client**: Full React components and hooks
- **Server**: Server-safe FlowBuilder (no React dependencies)
- **Automatic**: Package.json exports handle the correct imports

## 🎯 Overview

The `@databite/flow` package provides a React-based fluent API for building interactive workflows with:

- **Automatic Type Inference**: Each block knows about all previous block outputs
- **IDE Autocomplete**: Full IntelliSense support for flow context
- **Interactive UI Blocks**: Forms, confirmations, and display components
- **Built-in Blocks**: HTTP requests, transformations, delays, and logging
- **React Integration**: Hooks and components for seamless UI integration
- **Custom Blocks**: Extend with your own flow blocks and UI components
- **Error Handling**: Built-in error handling and user feedback
- **Form Validation**: Built-in form validation using react-hook-form
- **UI Components**: Pre-built UI components with Tailwind CSS

## 📚 API Reference

### Core Classes

#### FlowBuilder

The main class for building flows with automatic type inference and React integration. This is a server-safe implementation with no React dependencies.

```typescript
import { createFlow } from "@databite/flow";

const flow = createFlow("myFlow")
  .form("getUserInput", {
    fields: [{ name: "email", label: "Email", type: "email" }],
  })
  .http("fetchData", {
    url: (input) => `/api/users/${input.getUserInput.email}`,
    returnType: { id: "", name: "" },
  })
  .transform("processData", (input) => ({
    processed: input.fetchData.name.toUpperCase(),
  }))
  .build();
```

#### createFlow Function

Creates a new flow builder with automatic IDE autocomplete:

```typescript
export function createFlow<FlowReturnType extends z.ZodType = z.ZodAny>(
  name: string
): FlowBuilder<FlowReturnType, {}>;
```

### Builder Methods

#### Generic Block

Add any custom block with automatic type inference:

```typescript
.block<TName extends string, TOutput>(
  name: TName,
  run: (input: TContext) => Promise<TOutput>,
  options?: {
    requiresInteraction?: boolean;
    label?: string;
    description?: string;
    renderConfig?: any;
  }
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }>
```

#### Form Block

Create interactive forms for user input:

```typescript
.form<TName extends string, TOutput extends Record<string, any>>(
  name: TName,
  config: {
    fields: Array<{
      name: keyof TOutput;
      label: string;
      type?: "text" | "email" | "number" | "password" | "tel" | "url";
      placeholder?: string;
      required?: boolean;
      defaultValue?: any;
    }>;
    title?: string;
    description?: string;
    submitLabel?: string;
  }
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }>
```

#### Confirm Block

Add confirmation dialogs:

```typescript
.confirm<TName extends string>(
  name: TName,
  config: {
    title: string;
    message: string | ((context: TContext) => string);
    confirmLabel?: string;
    cancelLabel?: string;
  }
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: boolean }>
```

#### Display Block

Show information to users:

```typescript
.display<TName extends string>(
  name: TName,
  config: {
    title?: string;
    content: string | ((context: TContext) => string);
    continueLabel?: string;
  }
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: void }>
```

#### HTTP Block

Make HTTP requests with automatic error handling:

```typescript
.http<TName extends string, TOutput extends Record<string, any>>(
  name: TName,
  config: {
    url: string | ((input: TContext) => string);
    returnType: TOutput;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string> | ((input: TContext) => Record<string, string>);
    body?: Record<string, any> | ((input: TContext) => Record<string, any>);
    timeout?: number;
  }
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }>
```

#### Transform Block

Transform data with full type safety:

```typescript
.transform<TName extends string, TOutput extends Record<string, any>>(
  name: TName,
  transform: (input: TContext) => TOutput | Promise<TOutput>
): FlowBuilder<FlowReturnType, TContext & Record<typeof name, TOutput>>
```

#### Delay Block

Add delays between operations:

```typescript
.delay<TName extends string>(
  name: TName,
  milliseconds: number
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TContext }>
```

#### Log Block

Add logging for debugging:

```typescript
.log<TName extends string>(
  name: TName,
  message?: string | ((input: TContext) => string)
): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TContext }>
```

#### Returns Method

Specify the final return value transformation:

```typescript
.returns(
  transform: (context: TContext) => z.infer<FlowReturnType>
): FlowBuilder<FlowReturnType, TContext>
```

### React Integration

#### useFlowExecution Hook

Manage flow execution state and control with automatic flow hydration:

```typescript
import { useFlowExecution } from "@databite/flow";

function MyFlowComponent({ flow }) {
  const {
    state, // Current flow state (FlowState)
    currentBlock, // Current block being executed [blockName, block]
    proceed, // Start/continue flow execution
    reset, // Reset flow to beginning
    getResult, // Get final execution result with proper return type transformation
    handleBlockComplete, // Handle interactive block completion
    handleBlockError, // Handle interactive block errors
  } = useFlowExecution(flow);

  // Auto-proceed for non-interactive blocks
  useEffect(() => {
    if (!state.isExecuting && !state.isComplete) {
      proceed();
    }
  }, [state.isExecuting, state.isComplete, proceed]);

  return (
    <div>
      <div>
        Step {state.currentStepIndex + 1} of {state.totalSteps}
      </div>
      <div>Current: {state.currentBlockName}</div>
      {state.isComplete && (
        <div>Result: {JSON.stringify(getResult().data)}</div>
      )}
    </div>
  );
}
```

**FlowState Properties:**

- `currentStepIndex`: Current step number (0-based)
- `totalSteps`: Total number of steps in the flow
- `currentBlockName`: Name of the current block
- `isExecuting`: Whether the flow is currently executing
- `isComplete`: Whether the flow has completed
- `context`: Current execution context with all block outputs
- `steps`: Array of completed step results
- `startTime`: Timestamp when flow execution started
- `error`: Error message if execution failed

#### FlowRenderer Component

Automatically render flow UI with built-in handling and automatic flow hydration:

```typescript
import { FlowRenderer } from "@databite/flow";

function App() {
  const flow = createFlow("myFlow")
    .form("getInput", { fields: [{ name: "name", label: "Name" }] })
    .display("showResult", {
      content: (input) => `Hello ${input.getInput.name}!`,
    })
    .build();

  return (
    <FlowRenderer
      flow={flow}
      onComplete={(result) => {
        console.log("Flow completed:", result.data);
      }}
    />
  );
}
```

**FlowRenderer Features:**

- Automatic flow hydration with render functions
- Auto-proceeds for non-interactive blocks
- Handles block rendering with proper hook isolation
- Calls `onComplete` callback when flow finishes
- Shows skeleton loader during transitions

## 🎨 UI Components

The package includes a comprehensive set of UI components built with Radix UI and Tailwind CSS:

### Form Components

- **Form** - Form wrapper with react-hook-form integration
- **Input** - Text input with various types (text, email, number, password, tel, url)
- **Label** - Accessible form labels
- **Select** - Dropdown selection component

### Display Components

- **Card** - Container component for content
- **Badge** - Status and label indicators
- **Dialog** - Modal dialogs for confirmations
- **Empty** - Empty state component
- **Skeleton** - Loading state component

### Interactive Components

- **Button** - Various button styles and states
- **Switch** - Toggle switch component

### Styling

All components are built with:

- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **Class Variance Authority** - Type-safe component variants
- **Lucide React** - Beautiful, customizable icons

### Usage in Custom Blocks

```typescript
import { Button, Card, Input, Label } from "@databite/flow";

const customFlow = createFlow("customFlow")
  .block(
    "customForm",
    async () => {
      throw new Error("Should use onComplete");
    },
    {
      render: ({ onComplete, onError }) => (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <Button onClick={() => onComplete({ name: "John" })}>Submit</Button>
          </div>
        </Card>
      ),
      requiresInteraction: true,
    }
  )
  .build();
```

## 💡 Usage Examples

### Basic Interactive Flow

```typescript
import { createFlow, FlowRenderer } from "@databite/flow";
import { z } from "zod";

// Define return type schema
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  isActive: z.boolean(),
});

// Create an interactive flow
const userFlow = createFlow<UserSchema>("createUser")
  .form("getUserInfo", {
    title: "User Information",
    description: "Please provide your details",
    fields: [
      { name: "name", label: "Full Name", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
    ],
  })
  .confirm("confirmDetails", {
    title: "Confirm Details",
    message: (input) =>
      `Create user: ${input.getUserInfo.name} (${input.getUserInfo.email})?`,
  })
  .http("createUser", {
    url: "https://api.example.com/users",
    method: "POST",
    returnType: { id: "", name: "", email: "", status: "" },
    body: (input) => ({
      name: input.getUserInfo.name,
      email: input.getUserInfo.email,
    }),
  })
  .transform("processUser", (input) => ({
    id: input.createUser.id,
    name: input.createUser.name,
    email: input.createUser.email,
    isActive: input.createUser.status === "active",
  }))
  .display("showResult", {
    title: "Success!",
    content: (input) =>
      `User ${input.processUser.name} created with ID: ${input.processUser.id}`,
  })
  .returns((context) => context.processUser)
  .build();

// Use in React component
function UserCreationPage() {
  return (
    <FlowRenderer
      flow={userFlow}
      onComplete={(result) => {
        if (result.success) {
          console.log("User created:", result.data);
        } else {
          console.error("Flow failed:", result.error);
        }
      }}
    />
  );
}
```

**Key Features Demonstrated:**

- **Type Safety**: Full TypeScript support with Zod schema validation
- **Interactive Forms**: Built-in form handling with validation
- **HTTP Requests**: Automatic error handling and timeout support
- **Data Transformation**: Type-safe data processing between steps
- **User Feedback**: Confirmation dialogs and result displays
- **Return Transformation**: Proper return type handling

### Data Processing Flow

```typescript
import { createFlow } from "@databite/flow";

const dataProcessingFlow = createFlow("processData")
  .form("getConfig", {
    title: "Processing Configuration",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
      {
        name: "baseUrl",
        label: "Base URL",
        defaultValue: "https://api.example.com",
      },
    ],
  })
  .http("fetchRawData", {
    url: (input) => `${input.getConfig.baseUrl}/data/raw`,
    method: "GET",
    returnType: { items: [] },
    headers: (input) => ({
      Authorization: `Bearer ${input.getConfig.apiKey}`,
    }),
  })
  .transform("validateData", (input) => {
    const validItems = input.fetchRawData.items.filter(
      (item) => item.id && item.name && item.status
    );

    return {
      validItems,
      totalCount: input.fetchRawData.items.length,
      validCount: validItems.length,
      invalidCount: input.fetchRawData.items.length - validItems.length,
    };
  })
  .display("showValidation", {
    title: "Data Validation Results",
    content: (input) =>
      `Found ${input.validateData.validCount} valid items out of ${input.validateData.totalCount} total items.`,
  })
  .confirm("proceedWithProcessing", {
    title: "Continue Processing?",
    message: (input) => `Process ${input.validateData.validCount} valid items?`,
  })
  .transform("enrichData", async (input) => {
    if (!input.proceedWithProcessing) {
      return { enrichedItems: [], processed: false };
    }

    // Simulate data enrichment
    const enrichedItems = input.validateData.validItems.map((item) => ({
      ...item,
      enrichedAt: new Date().toISOString(),
      category: "default",
    }));

    return { enrichedItems, processed: true };
  })
  .http("saveProcessedData", {
    url: (input) => `${input.getConfig.baseUrl}/data/processed`,
    method: "POST",
    returnType: { success: true, count: 0 },
    headers: (input) => ({
      Authorization: `Bearer ${input.getConfig.apiKey}`,
      "Content-Type": "application/json",
    }),
    body: (input) => ({
      items: input.enrichData.enrichedItems,
      metadata: {
        processedAt: new Date().toISOString(),
        totalProcessed: input.enrichData.enrichedItems.length,
      },
    }),
  })
  .display("showCompletion", {
    title: "Processing Complete!",
    content: (input) =>
      `Successfully processed ${input.saveProcessedData.count} items.`,
  })
  .returns((context) => ({
    processed: context.enrichData.processed,
    itemCount: context.saveProcessedData.count,
    timestamp: new Date().toISOString(),
  }))
  .build();
```

### Custom Hook Usage

```typescript
import { createFlow, useFlowExecution } from "@databite/flow";
import { useState, useEffect } from "react";

const customFlow = createFlow("customFlow")
  .form("getInput", {
    fields: [{ name: "value", label: "Enter a number", type: "number" }],
  })
  .transform("calculate", (input) => ({
    result: input.getInput.value * 2,
    original: input.getInput.value,
  }))
  .display("showResult", {
    content: (input) => `${input.original} * 2 = ${input.calculate.result}`,
  })
  .build();

function CustomFlowComponent() {
  const {
    state,
    currentBlock,
    proceed,
    reset,
    getResult,
    handleBlockComplete,
    handleBlockError,
  } = useFlowExecution(customFlow);

  const [customMessage, setCustomMessage] = useState("");

  // Auto-proceed for non-interactive blocks
  useEffect(() => {
    if (!state.isExecuting && !state.isComplete) {
      proceed();
    }
  }, [state.isExecuting, state.isComplete, proceed]);

  // Custom handling for specific blocks
  const handleCustomBlock = (blockName: string) => {
    if (blockName === "calculate") {
      // Add custom logic here
      setCustomMessage("Calculation completed!");
    }
  };

  if (state.isComplete) {
    const result = getResult();
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="text-green-800 font-semibold">Flow Complete!</h3>
        <p className="text-green-600">{customMessage}</p>
        <pre className="mt-2 text-sm text-gray-700">
          {JSON.stringify(result.data, null, 2)}
        </pre>
        <button
          onClick={reset}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Again
        </button>
      </div>
    );
  }

  const [blockName, block] = currentBlock;

  if (block.render) {
    return (
      <div>
        <div className="mb-4 text-sm text-gray-600">
          Step {state.currentStepIndex + 1} of {state.totalSteps}: {blockName}
        </div>
        {block.render({
          context: state.context,
          onComplete: (data) => {
            handleCustomBlock(blockName);
            handleBlockComplete(data);
          },
          onError: handleBlockError,
        })}
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-blue-800">
          Executing: {blockName} (Step {state.currentStepIndex + 1} of{" "}
          {state.totalSteps})
        </span>
      </div>
    </div>
  );
}
```

**Custom Hook Features:**

- **Manual Control**: Full control over flow execution
- **Custom UI**: Build your own UI around flow state
- **Block Handling**: Custom logic for specific blocks
- **State Management**: Access to complete flow state
- **Error Handling**: Custom error handling and recovery

## 🔧 Advanced Usage

### Custom Flow Blocks

Create your own flow blocks with custom UI components:

```typescript
import { createFlow } from "@databite/flow";
import React from "react";

// Custom file upload block
const fileUploadFlow = createFlow("fileUpload")
  .block(
    "uploadFile",
    async (input) => {
      // This would be called programmatically
      throw new Error(
        "File upload blocks should use onComplete() instead of run()"
      );
    },
    {
      render: ({ onComplete, onError }) => {
        const [file, setFile] = React.useState<File | null>(null);
        const [uploading, setUploading] = React.useState(false);

        const handleUpload = async () => {
          if (!file) {
            onError("Please select a file");
            return;
          }

          setUploading(true);
          try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            const result = await response.json();
            onComplete(result);
          } catch (error) {
            onError(error.message);
          } finally {
            setUploading(false);
          }
        };

        return (
          <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Upload File</h2>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        );
      },
      requiresInteraction: true,
    }
  )
  .transform("processFile", (input) => ({
    fileName: input.uploadFile.fileName,
    fileSize: input.uploadFile.fileSize,
    uploadedAt: new Date().toISOString(),
  }))
  .build();
```

### Conditional Logic with User Interaction

```typescript
import { createFlow } from "@databite/flow";

const conditionalFlow = createFlow("conditionalProcessing")
  .form("getUserChoice", {
    title: "Processing Options",
    fields: [
      {
        name: "processType",
        label: "Processing Type",
        required: true,
        defaultValue: "standard",
      },
    ],
  })
  .transform("checkRequirements", (input) => {
    const needsConfirmation = input.getUserChoice.processType === "advanced";

    return {
      processType: input.getUserChoice.processType,
      needsConfirmation,
      estimatedTime:
        input.getUserChoice.processType === "advanced"
          ? "5 minutes"
          : "2 minutes",
    };
  })
  .confirm("confirmAdvanced", {
    title: "Advanced Processing",
    message: (input) =>
      `Advanced processing will take ${input.checkRequirements.estimatedTime}. Continue?`,
  })
  .transform("executeProcessing", (input) => {
    if (
      input.checkRequirements.processType === "advanced" &&
      !input.confirmAdvanced
    ) {
      return { processed: false, reason: "User cancelled advanced processing" };
    }

    // Simulate processing based on type
    const processingTime =
      input.checkRequirements.processType === "advanced" ? 5000 : 2000;

    return {
      processed: true,
      type: input.checkRequirements.processType,
      duration: processingTime,
    };
  })
  .display("showResults", {
    title: "Processing Complete",
    content: (input) =>
      `Successfully completed ${input.executeProcessing.type} processing in ${input.executeProcessing.duration}ms`,
  })
  .build();
```

### Error Handling and Recovery

```typescript
import { createFlow } from "@databite/flow";

const robustFlow = createFlow("robustProcessing")
  .form("getConfig", {
    title: "Configuration",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
      {
        name: "retryCount",
        label: "Retry Count",
        type: "number",
        defaultValue: 3,
      },
    ],
  })
  .transform("validateConfig", (input) => {
    if (!input.getConfig.apiKey || input.getConfig.apiKey.length < 10) {
      throw new Error("Invalid API key provided");
    }

    return {
      apiKey: input.getConfig.apiKey,
      retryCount: Math.max(1, Math.min(5, input.getConfig.retryCount || 3)),
    };
  })
  .http("fetchData", {
    url: "https://api.example.com/data",
    method: "GET",
    returnType: { items: [] },
    headers: (input) => ({
      Authorization: `Bearer ${input.validateConfig.apiKey}`,
    }),
    timeout: 10000,
  })
  .transform("processData", (input) => {
    if (!input.fetchData.items || input.fetchData.items.length === 0) {
      throw new Error("No data received from API");
    }

    return {
      processedItems: input.fetchData.items.map((item) => ({
        ...item,
        processedAt: new Date().toISOString(),
      })),
      totalCount: input.fetchData.items.length,
    };
  })
  .display("showError", {
    title: "Processing Error",
    content: (input) => `An error occurred: ${input.error || "Unknown error"}`,
  })
  .build();
```

## 🎨 Best Practices

### 1. Use Descriptive Block Names

```typescript
// Good
.form("getUserProfile", { ... })
.http("fetchUserData", { ... })
.transform("validateUserData", (input) => { ... })
.display("showUserInfo", { ... })

// Avoid
.form("step1", { ... })
.http("fetch", { ... })
.transform("process", (input) => { ... })
.display("show", { ... })
```

### 2. Design User-Friendly Forms

```typescript
const userFriendlyFlow = createFlow("userFriendly")
  .form("getUserInfo", {
    title: "Welcome! Let's get started",
    description: "Please provide your information to continue",
    fields: [
      {
        name: "firstName",
        label: "First Name",
        placeholder: "Enter your first name",
        required: true,
      },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "your.email@example.com",
        required: true,
      },
      {
        name: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "+1 (555) 123-4567",
      },
    ],
    submitLabel: "Continue",
  })
  .build();
```

### 3. Handle Errors Gracefully with User Feedback

```typescript
const errorHandlingFlow = createFlow("errorHandling")
  .form("getConfig", {
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  })
  .http("fetchData", {
    url: "https://api.example.com/data",
    returnType: { items: [] },
    headers: (input) => ({ Authorization: `Bearer ${input.getConfig.apiKey}` }),
  })
  .transform("safeProcess", (input) => {
    try {
      if (!input.fetchData.items || input.fetchData.items.length === 0) {
        throw new Error("No data available");
      }

      return {
        result: input.fetchData.items.map((item) => processItem(item)),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error.message,
      };
    }
  })
  .display("showError", {
    title: "Processing Error",
    content: (input) =>
      input.safeProcess.error
        ? `Error: ${input.safeProcess.error}`
        : `Successfully processed ${input.safeProcess.result.length} items`,
  })
  .build();
```

### 4. Use TypeScript for Better Type Safety

```typescript
import { z } from "zod";

// Define schemas for type safety
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  isActive: z.boolean(),
});

const ProcessedUserSchema = UserSchema.extend({
  lastSeen: z.string(),
  processedAt: z.string(),
});

const typedFlow = createFlow<typeof ProcessedUserSchema>("typedFlow")
  .form("getUserInput", {
    fields: [{ name: "userId", label: "User ID", required: true }],
  })
  .http("fetchUser", {
    url: (input) => `/users/${input.getUserInput.userId}`,
    returnType: { id: "", name: "", email: "", status: "" },
  })
  .transform("processUser", (input) => ({
    id: input.fetchUser.id,
    name: input.fetchUser.name,
    email: input.fetchUser.email,
    isActive: input.fetchUser.status === "active",
    lastSeen: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  }))
  .returns((context) => context.processUser)
  .build();
```

### 5. Provide Clear User Feedback

```typescript
const feedbackFlow = createFlow("feedbackFlow")
  .display("welcome", {
    title: "Welcome to Data Processing",
    content: "This flow will help you process your data step by step.",
  })
  .form("getData", {
    title: "Data Configuration",
    description: "Please provide the necessary information",
    fields: [
      { name: "dataSource", label: "Data Source", required: true },
      { name: "processingType", label: "Processing Type", required: true },
    ],
  })
  .display("processing", {
    title: "Processing Your Data",
    content: (input) =>
      `Processing ${input.getData.dataSource} using ${input.getData.processingType} method...`,
  })
  .confirm("confirmResults", {
    title: "Review Results",
    message: (input) =>
      `Data processing completed. The results are ready for review. Continue?`,
  })
  .display("success", {
    title: "Success!",
    content:
      "Your data has been processed successfully. You can now download the results.",
  })
  .build();
```

## 🧪 Testing

### Unit Testing Flows

```typescript
import { createFlow } from "@databite/flow";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlowRenderer } from "@databite/flow";

const testFlow = createFlow("testFlow")
  .form("getInput", {
    fields: [{ name: "value", label: "Value", type: "number" }],
  })
  .transform("addOne", (input) => input.getInput.value + 1)
  .transform("multiplyByTwo", (input) => input.addOne * 2)
  .display("showResult", {
    content: (input) => `Result: ${input.multiplyByTwo}`,
  })
  .build();

// Test flow execution
test("flow processes input correctly", async () => {
  render(<FlowRenderer flow={testFlow} />);

  // Fill form
  const input = screen.getByLabelText("Value");
  fireEvent.change(input, { target: { value: "5" } });

  // Submit form
  const submitButton = screen.getByText("Continue");
  fireEvent.click(submitButton);

  // Wait for result
  await waitFor(() => {
    expect(screen.getByText("Result: 12")).toBeInTheDocument(); // (5 + 1) * 2
  });
});
```

### Testing Custom Blocks

```typescript
import { createFlow } from "@databite/flow";
import { render, screen, fireEvent } from "@testing-library/react";

const customFlow = createFlow("customFlow")
  .block(
    "customBlock",
    async () => {
      throw new Error("Should use onComplete");
    },
    {
      render: ({ onComplete, onError }) => (
        <div>
          <button onClick={() => onComplete({ test: "data" })}>Complete</button>
          <button onClick={() => onError("Test error")}>Error</button>
        </div>
      ),
      requiresInteraction: true,
    }
  )
  .build();

test("custom block handles completion", async () => {
  render(<FlowRenderer flow={customFlow} />);

  const completeButton = screen.getByText("Complete");
  fireEvent.click(completeButton);

  await waitFor(() => {
    expect(screen.getByText(/Flow Complete/)).toBeInTheDocument();
  });
});
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/connect](./packages/connect/) - Connection management and authentication
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📞 Support

- [GitHub Issues](https://github.com/databite/builder/issues) - Bug reports and feature requests
- [Discussions](https://github.com/databite/builder/discussions) - Community discussions and questions
- [Documentation](https://docs.databite.com) - Full documentation and guides
