import { ConnectorAnalysis } from './analyzer';
import fs from 'fs/promises';
import path from 'path';

export async function generateConnectorFiles(
  analysis: ConnectorAnalysis,
  outputPath: string
) {
  const connectorDir = path.join(outputPath, analysis.connectorId);
  
  // Create directory structure
  await fs.mkdir(connectorDir, { recursive: true });
  await fs.mkdir(path.join(connectorDir, 'actions'), { recursive: true });
  await fs.mkdir(path.join(connectorDir, 'syncs'), { recursive: true });
  
  // Generate index.ts
  await generateIndexFile(analysis, connectorDir);
  
  // Generate action files
  for (const action of analysis.actions) {
    await generateActionFile(action, connectorDir);
  }
  
  // Generate sync files
  for (const sync of analysis.syncs) {
    await generateSyncFile(sync, connectorDir);
  }
  
  // Generate README
  await generateReadme(analysis, connectorDir);
}

async function generateIndexFile(analysis: ConnectorAnalysis, dir: string) {
  const integrationConfigFields = analysis.integrationConfig.fields
    .map(f => `  ${f.name}: z.${f.type}()${f.description ? `.describe("${f.description}")` : ''}`)
    .join(',\n');
  
  const connectionConfigFields = analysis.connectionConfig.fields
    .map(f => `  ${f.name}: z.${f.type}()${f.description ? `.describe("${f.description}")` : ''}`)
    .join(',\n');
  
  const actionImports = analysis.actions
    .map(a => `import { ${a.name} } from './actions/${a.name}.js';`)
    .join('\n');
  
  const syncImports = analysis.syncs
    .map(s => `import { ${s.name} } from './syncs/${s.name}.js';`)
    .join('\n');
  
  const actionRegistrations = analysis.actions
    .map(a => `    ${a.name},`)
    .join('\n');
  
  const syncRegistrations = analysis.syncs
    .map(s => `    ${s.name},`)
    .join('\n');
  
  const authFlowCode = generateAuthFlowCode(analysis);
  
  const content = `import { createConnector } from "@databite/build";
import { createFlow } from "@databite/flow";
import { z } from "zod";
${actionImports}
${syncImports}

const ${analysis.connectorName}IntegrationConfigSchema = z.object({
${integrationConfigFields}
});

const ${analysis.connectorName}ConnectionConfigSchema = z.object({
${connectionConfigFields}
});

const ${analysis.connectorId} = createConnector<
  typeof ${analysis.connectorName}IntegrationConfigSchema,
  typeof ${analysis.connectorName}ConnectionConfigSchema
>()
  .withIdentity("${analysis.connectorId}", "${analysis.connectorName}")
  .withVersion("${analysis.version}")
  .withAuthor("${analysis.author}")
  .withLogo("https://via.placeholder.com/150")
  .withDocumentationUrl("https://docs.${analysis.connectorId}.com")
  .withDescription("${analysis.description}")
  .withIntegrationConfig(${analysis.connectorName}IntegrationConfigSchema)
  .withConnectionConfig(${analysis.connectorName}ConnectionConfigSchema)
  .withCategories(${analysis.categories.map(c => `"${c}"`).join(', ')})
  .withTags(${analysis.tags.map(t => `"${t}"`).join(', ')})
  .withAuthenticationFlow(${authFlowCode})
  .withRefresh(async (connection) => {
    // TODO: Implement token refresh logic
    return connection.config;
  })
  .withActions({
${actionRegistrations}
  })
  .withSyncs({
${syncRegistrations}
  })
  .build();

export default ${analysis.connectorId};
`;
  
  await fs.writeFile(path.join(dir, 'index.ts'), content);
}

function generateAuthFlowCode(analysis: ConnectorAnalysis): string {
  const flowName = `${analysis.connectorId}Auth`;
  
  // Generate flow based on authentication type
  if (analysis.authenticationFlow.type === 'oauth2') {
    return `createFlow<typeof ${analysis.connectorName}ConnectionConfigSchema>("${flowName}")
      .form("credentials", {
        title: "OAuth Configuration",
        description: "Enter your OAuth credentials",
        fields: [
          { name: "clientId", label: "Client ID", type: "text", required: true },
          { name: "clientSecret", label: "Client Secret", type: "password", required: true },
        ],
      })
      .transform("generateAuthUrl", (input) => ({
        authUrl: \`https://api.${analysis.connectorId}.com/oauth/authorize?client_id=\${input.credentials.clientId}\`,
      }))
      .display("showAuthUrl", {
        title: "Authorize",
        content: (input) => \`Visit: \${input.generateAuthUrl.authUrl}\`,
      })
      .form("authCode", {
        title: "Enter Authorization Code",
        fields: [{ name: "code", label: "Code", type: "text", required: true }],
      })
      .http("exchangeToken", {
        url: "https://api.${analysis.connectorId}.com/oauth/token",
        method: "POST",
        returnType: { accessToken: "", refreshToken: "" },
        body: (input) => ({
          code: input.authCode.code,
          clientId: input.credentials.clientId,
          clientSecret: input.credentials.clientSecret,
        }),
      })
      .returns((context) => ({
        accessToken: context.exchangeToken.accessToken,
        refreshToken: context.exchangeToken.refreshToken,
      }))
      .build()`;
  } else if (analysis.authenticationFlow.type === 'apiKey') {
    return `createFlow<typeof ${analysis.connectorName}ConnectionConfigSchema>("${flowName}")
      .form("apiKey", {
        title: "API Key Configuration",
        description: "Enter your API key",
        fields: [
          { name: "apiKey", label: "API Key", type: "password", required: true },
        ],
      })
      .returns((context) => ({
        apiKey: context.apiKey.apiKey,
      }))
      .build()`;
  }
  
  return `createFlow<typeof ${analysis.connectorName}ConnectionConfigSchema>("${flowName}")
    .form("auth", {
      title: "Authentication",
      fields: [
        { name: "token", label: "Token", type: "password", required: true },
      ],
    })
    .returns((context) => ({ token: context.auth.token }))
    .build()`;
}

async function generateActionFile(action: any, dir: string) {
  const inputFields = action.inputSchema.fields
    .map((f: any) => `  ${f.name}: z.${f.type}()${f.description ? `.describe("${f.description}")` : ''}`)
    .join(',\n');
  
  const outputFields = action.outputSchema.fields
    .map((f: any) => `  ${f.name}: z.${f.type}()`)
    .join(',\n');
  
  const content = `import { createAction } from "@databite/build";
import { z } from "zod";

const ${action.name}InputSchema = z.object({
${inputFields}
});

const ${action.name}OutputSchema = z.object({
${outputFields}
});

export const ${action.name} = createAction({
  label: "${action.label}",
  description: "${action.description}",
  inputSchema: ${action.name}InputSchema,
  outputSchema: ${action.name}OutputSchema,
  maxRetries: 3,
  timeout: 30000,
  handler: async (params, connection) => {
    // TODO: Implement ${action.label}
    const response = await fetch("${action.endpoint}", {
      method: "${action.method}",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${connection.config.accessToken}\`,
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return await response.json();
  },
});
`;
  
  await fs.writeFile(path.join(dir, 'actions', `${action.name}.ts`), content);
}

async function generateSyncFile(sync: any, dir: string) {
  const outputFields = sync.outputSchema.fields
    .map((f: any) => `  ${f.name}: z.${f.type}()`)
    .join(',\n');
  
  const content = `import { createSync } from "@databite/build";
import { z } from "zod";

const ${sync.name}OutputSchema = z.object({
${outputFields}
});

export const ${sync.name} = createSync({
  label: "${sync.label}",
  description: "${sync.description}",
  outputSchema: ${sync.name}OutputSchema,
  maxRetries: 3,
  timeout: 30000,
  handler: async (connection) => {
    // TODO: Implement ${sync.label}
    const response = await fetch("${sync.endpoint}", {
      method: "${sync.method}",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${connection.config.accessToken}\`,
      },
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return await response.json();
  },
});
`;
  
  await fs.writeFile(path.join(dir, 'syncs', `${sync.name}.ts`), content);
}

async function generateReadme(analysis: ConnectorAnalysis, dir: string) {
  const content = `# ${analysis.connectorName} Connector

${analysis.description}

## Installation

\`\`\`bash
npm install @databite/connectors
\`\`\`

## Usage

\`\`\`typescript
import ${analysis.connectorId} from '@databite/connectors/${analysis.connectorId}';

// Create integration
const integration = ${analysis.connectorId}.createIntegration("My ${analysis.connectorName}", {
  // Add your integration config here
});
\`\`\`

## Actions

${analysis.actions.map(a => `- **${a.label}**: ${a.description}`).join('\n')}

## Syncs

${analysis.syncs.map(s => `- **${s.label}**: ${s.description}`).join('\n')}

## Authentication

This connector uses ${analysis.authenticationFlow.type} authentication.

## License

MIT
`;
  
  await fs.writeFile(path.join(dir, 'README.md'), content);
}