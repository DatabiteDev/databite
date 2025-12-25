# Databite Dashboard

A web dashboard for managing Databite connectors, connections, and integrations. Built with Next.js, this application provides a user-friendly interface to monitor server performance.

## Features

- **📊 Analytics Overview**: Monitor server performance and activity metrics
- **🔗 Connector and Integration Management**: Browse available connectors and integrations
- **🔌 Connection Management**: Set up and manage connections to external services
- **📈 Recent Activity**: Track recent connector executions and sync operations

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS v4
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Prerequisites

- Node.js >= 18.0.0
- A running Databite server instance
- npm, yarn, or pnpm package manager

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/DatabiteDev/databite.git
   cd databite/packages/dashboard
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the dashboard directory:
   ```bash
   # URL of your Databite server API
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Development

Start the development server:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Building for Production

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Project Structure

```
packages/dashboard/
├── app/                    # Next.js app router pages
│   ├── components/         # Page-specific components
│   ├── connections/        # Connection management pages
│   ├── connectors/         # Connector management pages
│   ├── integrations/       # Integration management pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── loading.tsx         # Loading UI
│   └── page.tsx            # Home dashboard page
├── components/             # Shared UI components
│   ├── ui/                 # Reusable UI components (Radix-based)
│   └── ...                 # Feature-specific components
├── lib/                    # Utility libraries and configurations
├── public/                 # Static assets
└── utils/                  # Helper functions and utilities
```

## Key Components

### Analytics Overview

Displays key metrics about connector usage, sync performance, and system health.

### Connector Management

- Browse available connectors
- View connector details and capabilities
- Configure connector settings

### Connection Management

- Set up authenticated connections to external services
- Test connection health
- Manage connection credentials securely

### Integration Management

- Create integration instances from connectors
- Configure integration parameters
- Monitor integration execution status

## API Integration

The dashboard communicates with the Databite server via REST API endpoints. Key endpoints include:

- `GET /connectors` - List available connectors
- `GET /connections` - List active connections
- `GET /integrations` - List integration instances
- `POST /integrations/{id}/execute` - Execute an integration
- `GET /analytics` - Retrieve analytics data

## Deployment

The dashboard can be deployed to any platform that supports Next.js applications:

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Deploy with build command `npm run build` and publish directory `.next`
- **Docker**: Use the included Dockerfile for containerized deployment
- **Self-hosted**: Build and serve the static export or run the Node.js server

### Environment Variables for Production

```bash
NEXT_PUBLIC_API_URL=https://your-databite-server.com
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/connectors](./packages/connectors/) - Pre-built connector library
- [@databite/engine](./packages/engine/) - Data synchronization and execution engine
- [@databite/types](./packages/types/) - Shared TypeScript types

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
