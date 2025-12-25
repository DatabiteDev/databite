# @databite/example-webapp

A minimal example Next.js web application demonstrating how to use the **Databite SDK** to display available connectors, start authentication flows, and manage connections via server actions.

This project shows how to:

- Fetch connectors and integrations from a Databite backend
- Display them in a simple UI
- Trigger authentication using the `@databite/connect` modal
- Store successful connections back to the server

---

## 📦 Project Structure

```
example-webapp/
├── app/
│   ├── actions.ts          # Server actions for API requests (fetch connectors, integrations, flows, etc.)
│   ├── page.tsx            # Main UI that lists connectors and launches ConnectModal
│   ├── layout.tsx          # Root layout (shared app shell)
│   └── globals.css         # Global styles
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **>= 18.0.0**
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file at the root of your project:

```bash
# Base URL for your Databite API server
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If not provided, the application defaults to `http://localhost:3001`.

---

## 🎯 Features Demonstrated

- **Server Actions** (`actions.ts`)

  - Fetch integrations, connectors, and connections from an API
  - Add and remove connections
  - Manage flow sessions (start, step, and fetch)
  - Handle API errors gracefully

- **Client App** (`page.tsx`)
  - Fetch all available integrations with their connector metadata
  - Display a clickable list of integrations
  - Open a `ConnectModal` from `@databite/connect` for authentication
  - Handle success and error callbacks
  - Persist connection data through the backend

---

## 🧩 Key Components

### `ConnectModal` Usage

The app uses the `ConnectModal` from `@databite/connect` to handle OAuth or API key authentication for each integration.

```tsx
<ConnectModal
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
  integrationId={integration.integration.id}
  baseUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
  onAuthSuccess={handleAuthSuccess}
  onAuthError={handleAuthError}
/>
```

When authentication succeeds, the returned connection object is saved via `addConnection()`.

---

## 🧠 Example Flow

1. The app loads all **connectors** and **integrations** from the backend using:
   ```ts
   const integrations = await getIntegrationsWithConnectors();
   ```
2. Each integration is displayed in the UI with its name and logo.
3. When a user clicks an integration:
   - The `ConnectModal` opens.
   - The authentication flow begins.
4. On success:
   - The `connection` object is saved to the backend with `addConnection()`.
   - All existing connections can be fetched with `getConnections()`.

---

## 🔍 API Endpoints Used (Backend Expected)

| Endpoint                     | Method   | Description                 |
| ---------------------------- | -------- | --------------------------- |
| `/api/integrations`          | GET      | Fetch all integrations      |
| `/api/integrations/:id`      | GET      | Fetch a single integration  |
| `/api/connectors`            | GET      | Fetch all connectors        |
| `/api/connectors/:id`        | GET      | Fetch a single connector    |
| `/api/connections`           | GET/POST | Get or create connections   |
| `/api/connections/:id`       | DELETE   | Remove a connection         |
| `/api/flows/start`           | POST     | Start a flow session        |
| `/api/flows/:sessionId/step` | POST     | Execute a flow step         |
| `/api/flows/:sessionId`      | GET      | Retrieve flow session state |
| `/api/health`                | GET      | Health check endpoint       |

---

## 🧪 Example Screens

**Main Screen:** Displays a list of integrations (with connector logos).

**Connect Modal:** Opens Databite’s built-in authentication UI for that integration.

---

## 🚀 Deployment

This example can be deployed anywhere that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Docker**
- **AWS / GCP / Azure**

---

## 🧭 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Databite SDK Docs](https://docs.databite.io)
- [@databite/connect](https://www.npmjs.com/package/@databite/connect)

---

## 📄 License

MIT License — see [LICENSE](../../LICENSE) for details.
