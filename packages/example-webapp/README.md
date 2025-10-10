# @databite/example-webapp

A comprehensive example Next.js web application demonstrating the Databite SDK in action. This application showcases how to integrate connectors, manage connections, and build data synchronization workflows using the Databite SDK.

## 📦 Package Structure

```
example-webapp/
├── app/                    # Next.js app directory
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components
├── lib/                    # Utility functions
│   └── utils.ts
├── __tests__/              # Test files
│   ├── App.test.tsx
│   ├── setup.ts
│   └── utils.test.ts
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Or with other package managers
yarn install
pnpm install
bun install
```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎯 Features

This example application demonstrates:

- **Connector Integration**: How to integrate with various third-party APIs
- **Authentication Flows**: OAuth and API key authentication patterns
- **Data Synchronization**: Real-time and scheduled data sync operations
- **UI Components**: Pre-built React components for connection management
- **Flow Execution**: Interactive workflows for complex operations
- **Error Handling**: Robust error handling and user feedback
- **Type Safety**: Full TypeScript integration with the Databite SDK

## 📚 Usage Examples

### Basic Connector Setup

```typescript
import { ConnectModal } from "@databite/connect";
import { slackConnector } from "@databite/connectors";

function SlackIntegration() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ConnectModal
      open={isOpen}
      onOpenChange={setIsOpen}
      integration={slackConnector.createIntegration("My Slack", {
        clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/slack/callback`,
      })}
      onAuthSuccess={(integration, config) => {
        console.log("Slack connected:", config);
        // Save connection to your backend
      }}
    />
  );
}
```

### Data Synchronization

```typescript
import { DatabiteEngine } from "@databite/engine";

const engine = new DatabiteEngine({
  dataProvider: async () => {
    // Fetch connections and integrations from your database
    return {
      connections: await fetchConnections(),
      integrations: await fetchIntegrations(),
    };
  },
  dataExporter: async ({ connections, integrations }) => {
    // Save data to your database
    await saveConnections(connections);
    await saveIntegrations(integrations);
    return { success: true, error: null };
  },
  schedulerAdapter: new BullMQAdapter(),
  minutesBetweenSyncs: 5,
});
```

### Flow Execution

```typescript
import { createFlow, FlowRenderer } from "@databite/flow";

const userOnboardingFlow = createFlow("userOnboarding")
  .form("getUserInfo", {
    title: "Welcome! Let's get started",
    fields: [
      { name: "name", label: "Full Name", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
    ],
  })
  .http("createUser", {
    url: "/api/users",
    method: "POST",
    returnType: { id: "", name: "", email: "" },
    body: (input) => ({
      name: input.getUserInfo.name,
      email: input.getUserInfo.email,
    }),
  })
  .display("showSuccess", {
    title: "Success!",
    content: (input) => `Welcome ${input.createUser.name}!`,
  })
  .build();

function OnboardingPage() {
  return (
    <FlowRenderer
      flow={userOnboardingFlow}
      onComplete={(result) => {
        console.log("Onboarding completed:", result.data);
      }}
    />
  );
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Slack Integration
NEXT_PUBLIC_SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret

# Trello Integration
NEXT_PUBLIC_TRELLO_API_KEY=your-trello-api-key
TRELLO_API_TOKEN=your-trello-api-token

# Database
DATABASE_URL=your-database-url

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

This example uses Prisma for database management:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database
npx prisma db seed
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set your environment variables in the Vercel dashboard
4. Deploy!

### Other Platforms

This application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Deploy directly from GitHub
- **Docker**: Use the included Dockerfile
- **AWS/GCP/Azure**: Use their respective deployment services

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Databite SDK Documentation](./packages/build/README.md) - Core SDK documentation
- [Flow Engine Documentation](./packages/flow/README.md) - Flow engine documentation
- [Connectors Documentation](./packages/connectors/README.md) - Pre-built connectors
- [Engine Documentation](./packages/engine/README.md) - Data synchronization and execution engine

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
