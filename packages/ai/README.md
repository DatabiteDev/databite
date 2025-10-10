# @databite/ai

AI-powered connector generator for the Databite SDK ecosystem. Automatically generate connectors from API documentation using advanced AI models.

## 📦 Package Structure

```
ai/
├── src/
│   ├── analyzer.ts          # AI-powered documentation analysis
│   ├── crawler.ts           # Web documentation crawler
│   ├── file-generator.ts    # Connector file generation
│   ├── generator.ts         # Main generation orchestrator
│   └── cli.ts               # Command-line interface
├── dist/                    # Compiled JavaScript output
├── package.json
└── README.md
```

## 🚀 Installation

```bash
npm install @databite/ai
```

**Peer Dependencies:**

```bash
npm install @databite/types @databite/build @databite/flow
```

## 🎯 Overview

The `@databite/ai` package provides intelligent connector generation capabilities that:

- **Crawl API Documentation**: Automatically extract content from documentation websites
- **AI Analysis**: Use advanced AI models to understand API structure and capabilities
- **Generate Connectors**: Create complete connector implementations with actions and syncs
- **Multiple AI Providers**: Support for OpenAI, Anthropic, and Google AI models
- **CLI Interface**: Easy-to-use command-line tool for rapid connector generation

## 🛠️ Features

### Intelligent Documentation Crawling

- **Multi-page Crawling**: Automatically discover and crawl related documentation pages
- **Content Extraction**: Clean HTML to Markdown conversion for better AI processing
- **Link Discovery**: Follow internal documentation links to build comprehensive understanding
- **Configurable Depth**: Control how deep the crawler goes into documentation

### AI-Powered Analysis

- **API Structure Recognition**: Automatically identify authentication methods, endpoints, and data schemas
- **Action Generation**: Extract CRUD operations and transform them into connector actions
- **Sync Detection**: Identify list/fetch operations for data synchronization
- **Schema Inference**: Generate Zod schemas for input/output validation
- **Authentication Flow**: Create appropriate authentication flows (OAuth2, API Key, Basic Auth)

### Code Generation

- **Complete Connector Files**: Generate full connector implementations
- **Type-Safe Schemas**: Create Zod schemas for all configurations and data structures
- **Action Implementations**: Generate action handlers with proper error handling
- **Sync Implementations**: Create sync handlers for data synchronization
- **Documentation**: Auto-generate README files with usage examples

## 🚀 Quick Start

### CLI Usage

```bash
# Generate a connector from API documentation
npx databite-ai generate \
  --url "https://api.example.com/docs" \
  --output "./connectors" \
  --name "Example API" \
  --ai-provider openai \
  --model gpt-4o
```

### Programmatic Usage

```typescript
import { generateConnector } from "@databite/ai";

const analysis = await generateConnector({
  url: "https://api.example.com/docs",
  outputPath: "./connectors",
  connectorName: "Example API",
  crawlDepth: 2,
  generateActions: true,
  generateSyncs: true,
  aiProvider: "openai",
  aiModel: "gpt-4o",
});
```

## 📚 API Reference

### Core Functions

#### `generateConnector(options: GeneratorOptions)`

Main function to generate a connector from documentation.

```typescript
interface GeneratorOptions {
  url: string; // Documentation URL to crawl
  outputPath: string; // Directory to write generated files
  connectorName?: string; // Optional connector name
  crawlDepth: number; // How deep to crawl (default: 2)
  generateActions: boolean; // Whether to generate actions
  generateSyncs: boolean; // Whether to generate syncs
  aiProvider: "anthropic" | "openai" | "google";
  aiModel?: string; // Optional model override
}
```

#### `crawlDocumentation(startUrl: string, maxDepth?: number)`

Crawl documentation from a starting URL.

```typescript
interface DocumentationCrawlResult {
  baseUrl: string;
  pages: CrawledPage[];
}

interface CrawledPage {
  url: string;
  title: string;
  content: string;
  links: string[];
}
```

#### `analyzeDocumentation(docs: DocumentationCrawlResult, options: AnalyzerOptions)`

Analyze crawled documentation using AI.

```typescript
interface AnalyzerOptions {
  connectorName?: string;
  generateActions: boolean;
  generateSyncs: boolean;
  aiProvider: "anthropic" | "openai" | "google";
  aiModel?: string;
}
```

### Generated Connector Structure

The AI generator creates a complete connector with the following structure:

```
connector-name/
├── index.ts              # Main connector definition
├── actions/              # Action implementations
│   ├── createUser.ts
│   ├── getUser.ts
│   └── updateUser.ts
├── syncs/               # Sync implementations
│   ├── syncUsers.ts
│   └── syncOrders.ts
└── README.md            # Generated documentation
```

## 🤖 AI Provider Configuration

### OpenAI

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key"

# Use OpenAI models
npx databite-ai generate --ai-provider openai --model gpt-4o
```

### Anthropic

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY="your-api-key"

# Use Anthropic models
npx databite-ai generate --ai-provider anthropic --model claude-sonnet-4-5-20250929
```

### Google AI

```bash
# Set your Google AI API key
export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Use Google models
npx databite-ai generate --ai-provider google --model gemini-2.0-flash-exp
```

## 📋 CLI Commands

### Generate Connector

```bash
databite-ai generate [options]

Options:
  -u, --url <url>              Documentation URL (required)
  -o, --output <path>          Output directory path (required)
  -n, --name <name>            Connector name (auto-detected if not provided)
  -d, --depth <number>         Crawl depth for documentation links (default: 2)
  --no-actions                 Skip generating actions
  --no-syncs                   Skip generating syncs
  -a, --ai-provider <provider> AI provider: openai, anthropic, google (default: openai)
  -m, --model <model>          AI model (default: gpt-4o)
  -h, --help                   Display help
```

### Examples

```bash
# Basic generation
databite-ai generate -u "https://stripe.com/docs/api" -o "./connectors"

# With custom name and AI provider
databite-ai generate \
  -u "https://api.github.com/docs" \
  -o "./connectors" \
  -n "GitHub API" \
  --ai-provider anthropic \
  --model claude-sonnet-4-5-20250929

# Skip syncs, custom depth
databite-ai generate \
  -u "https://api.slack.com/docs" \
  -o "./connectors" \
  --no-syncs \
  --depth 3
```

## 🔧 Advanced Usage

### Custom AI Models

```typescript
import { generateConnector } from "@databite/ai";

// Use specific models
await generateConnector({
  url: "https://api.example.com/docs",
  outputPath: "./connectors",
  aiProvider: "openai",
  aiModel: "gpt-4-turbo", // Custom model
  generateActions: true,
  generateSyncs: true,
});
```

### Crawling Configuration

```typescript
// Deep crawling for complex APIs
await generateConnector({
  url: "https://api.example.com/docs",
  outputPath: "./connectors",
  crawlDepth: 4, // Crawl deeper into documentation
  generateActions: true,
  generateSyncs: true,
});
```

### Selective Generation

```typescript
// Generate only actions, skip syncs
await generateConnector({
  url: "https://api.example.com/docs",
  outputPath: "./connectors",
  generateActions: true,
  generateSyncs: false, // Skip sync generation
});
```

## 🎨 Generated Code Examples

### Connector Definition

```typescript
import { createConnector } from "@databite/build";
import { createFlow } from "@databite/flow";
import { z } from "zod";

const ExampleIntegrationConfigSchema = z.object({
  apiKey: z.string().describe("Your API key"),
  baseUrl: z.string().url().describe("API base URL"),
});

const ExampleConnectionConfigSchema = z.object({
  accessToken: z.string().describe("OAuth access token"),
  refreshToken: z.string().describe("OAuth refresh token"),
});

const exampleConnector = createConnector<
  typeof ExampleIntegrationConfigSchema,
  typeof ExampleConnectionConfigSchema
>()
  .withIdentity("example", "Example API")
  .withVersion("1.0.0")
  .withAuthor("Databite AI")
  .withDescription("AI-generated connector for Example API")
  .withIntegrationConfig(ExampleIntegrationConfigSchema)
  .withConnectionConfig(ExampleConnectionConfigSchema)
  .withCategories("productivity")
  .withTags("api", "integration")
  .withAuthenticationFlow(/* OAuth flow */)
  .withActions({
    createUser,
    getUser,
    updateUser,
  })
  .withSyncs({
    syncUsers,
    syncOrders,
  })
  .build();
```

### Generated Action

```typescript
import { createAction } from "@databite/build";
import { z } from "zod";

const CreateUserInputSchema = z.object({
  name: z.string().describe("User name"),
  email: z.string().email().describe("User email"),
});

const CreateUserOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const createUser = createAction({
  label: "Create User",
  description: "Create a new user",
  inputSchema: CreateUserInputSchema,
  outputSchema: CreateUserOutputSchema,
  maxRetries: 3,
  timeout: 30000,
  handler: async (params, connection) => {
    const response = await fetch("https://api.example.com/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connection.config.accessToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },
});
```

## 🧪 Testing Generated Connectors

### Manual Testing

```typescript
import { exampleConnector } from "./connectors/example";

// Test integration creation
const integration = exampleConnector.createIntegration("Test Integration", {
  apiKey: "your-api-key",
  baseUrl: "https://api.example.com",
});

// Test action execution
const result = await exampleConnector.actions.createUser.execute(
  { name: "John Doe", email: "john@example.com" },
  connection
);
```

### Automated Testing

```typescript
import { describe, it, expect } from "vitest";
import { exampleConnector } from "./connectors/example";

describe("Example Connector", () => {
  it("should create integration with valid config", () => {
    const integration = exampleConnector.createIntegration("Test", {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    });

    expect(integration).toBeDefined();
    expect(integration.config.apiKey).toBe("test-key");
  });
});
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Crawling Failures

```bash
# Increase timeout and retry
databite-ai generate \
  -u "https://api.example.com/docs" \
  -o "./connectors" \
  --depth 1  # Reduce depth if crawling fails
```

#### 2. AI Analysis Errors

```bash
# Try different AI provider
databite-ai generate \
  -u "https://api.example.com/docs" \
  -o "./connectors" \
  --ai-provider anthropic  # Switch to Anthropic
```

#### 3. Generated Code Issues

```typescript
// Review and manually fix generated code
// The AI generates working templates that may need customization
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=databite-ai:* databite-ai generate -u "https://api.example.com/docs" -o "./connectors"
```

## 🔗 Related Packages

- [@databite/build](./packages/build/) - Core connector builder SDK
- [@databite/flow](./packages/flow/) - Flow engine for authentication workflows
- [@databite/types](./packages/types/) - Shared TypeScript types
- [@databite/connectors](./packages/connectors/) - Pre-built connector library

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
