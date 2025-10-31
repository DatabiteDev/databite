# example-webapp

## 1.0.0

### Major Changes

- 950dc14: First working production version of the databite libraries

### Patch Changes

- Updated dependencies [950dc14]
  - @databite/connect@3.0.0
  - @databite/types@4.0.0

## 0.4.0

### Minor Changes

- Added server package

### Patch Changes

- Updated dependencies
  - @databite/connect@2.0.0
  - @databite/types@3.0.0

## 0.3.0

### Minor Changes

- e9e3bdf: Fixed Oauth flow, Removed unfinished Trello Connector.

### Patch Changes

- Updated dependencies [e9e3bdf]
  - @databite/connectors@2.1.0
  - @databite/connect@1.2.0
  - @databite/engine@1.2.0
  - @databite/types@2.1.0
  - @databite/flow@2.1.0
  - @databite/ai@1.1.1
  - @databite/build@1.1.1

## 0.2.0

### Minor Changes

- ````markdown
  ---
  "@databite/flow": major
  ---

  \*\*Breaking Changes: Server/Client Separation and Schema-Based Forms\*\*

  \## Major Changes

  \### 🔄 Server/Client Architecture Split

  \- \*\*BREAKING\*\*: Separated flow builder from flow execution to support Next.js server/client boundaries

  \- Added automatic context detection via `react-server` conditional exports

  \- Server-safe `FlowBuilder` can now be used in Server Actions and Server Components

  \- Client-side `FlowRenderer` automatically hydrates flows with React components

  \- Users no longer need to specify `/client` imports - the package automatically serves the correct code based on context

  \*\*Migration\*\*: No code changes required! The same imports work everywhere:

  ```typescript
  // Works in Server Actions

  import { createFlow } from "@databite/flow";

  // Works in Client Components

  import { FlowRenderer } from "@databite/flow";
  ```
  ````

  \### 📝 Schema-Based Form Validation

  \- \*\*BREAKING\*\*: `.form()` now accepts a Zod schema instead of field definitions

  \- Form fields are automatically generated from the schema

  \- Auto-detects input types (email, number, url) from Zod validators

  \- Auto-generates labels from field names (camelCase → Title Case)

  \- Required field indicators based on `.optional()` modifier

  \- Optional `fieldConfig` for customizing labels, placeholders, and types

  \*\*Migration Guide\*\*:

  ```typescript

  // Before

  .form("credentials", {

  &nbsp; fields: \[

  &nbsp;   { name: "apiKey", label: "API Key", required: true },

  &nbsp;   { name: "email", label: "Email", type: "email", required: true }

  &nbsp; ]

  })



  // After

  const CredentialsSchema = z.object({

  &nbsp; apiKey: z.string().min(1, "API Key is required"),

  &nbsp; email: z.string().email("Invalid email address")

  });



  .form("credentials", {

  &nbsp; schema: CredentialsSchema,

  &nbsp; // Optional customization

  &nbsp; fieldConfig: {

  &nbsp;   apiKey: { placeholder: "sk-..." }

  &nbsp; }

  })

  ```

  \## Minor Changes

  \### 🎨 Improved Loading States

  \- Fixed empty screen issue for non-interactive blocks during execution

  \- Non-interactive blocks now show loading spinner with optional description

  \- Better visual feedback during async operations

  \### 🔧 Type Safety Improvements

  \- Changed React import to type-only (`import type React`) to prevent server-side bundling

  \- Flow types no longer cause issues when imported in server contexts

  \- Full type inference maintained throughout the flow builder chain

  \## Internal Changes

  \- Auto-hydration of flows happens internally in `useFlowExecution` hook

  \- Render functions are generated from `renderConfig` on the client side

  \- Build process now generates separate `server.js` and `index.js` bundles

  ```

  ```

### Patch Changes

- Updated dependencies
  - @databite/connectors@2.0.0
  - @databite/flow@2.0.0
  - @databite/types@2.0.0
  - @databite/ai@1.1.0
  - @databite/build@1.1.0
  - @databite/connect@1.1.0
  - @databite/engine@1.1.0
