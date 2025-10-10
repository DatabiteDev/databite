import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { DocumentationCrawlResult } from "./crawler";

const ConnectorAnalysisSchema = z.object({
  connectorId: z.string(),
  connectorName: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string(),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  integrationConfig: z.object({
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean"]),
        description: z.string(),
        required: z.boolean(),
      })
    ),
  }),
  connectionConfig: z.object({
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean"]),
        description: z.string(),
        required: z.boolean(),
      })
    ),
  }),
  authenticationFlow: z.object({
    type: z.enum(["oauth2", "apiKey", "basic", "custom"]),
    steps: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["form", "http", "transform", "display", "confirm"]),
        description: z.string(),
        config: z.any(),
      })
    ),
  }),
  actions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      label: z.string(),
      description: z.string(),
      endpoint: z.string(),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
      inputSchema: z.object({
        fields: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            description: z.string(),
            required: z.boolean(),
          })
        ),
      }),
      outputSchema: z.object({
        fields: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            description: z.string(),
          })
        ),
      }),
    })
  ),
  syncs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      label: z.string(),
      description: z.string(),
      endpoint: z.string(),
      method: z.enum(["GET", "POST"]),
      outputSchema: z.object({
        fields: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            description: z.string(),
          })
        ),
      }),
    })
  ),
});

export type ConnectorAnalysis = z.infer<typeof ConnectorAnalysisSchema>;

export interface AnalyzerOptions {
  connectorName?: string;
  generateActions: boolean;
  generateSyncs: boolean;
  aiProvider: "anthropic" | "openai" | "google";
  aiModel?: string;
}

function getModel(provider: string, modelName?: string) {
  switch (provider) {
    case "anthropic":
      return anthropic(modelName || "claude-sonnet-4-5-20250929");
    case "openai":
      return openai(modelName || "gpt-4o");
    case "google":
      return google(modelName || "gemini-2.0-flash-exp");
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export async function analyzeDocumentation(
  docs: DocumentationCrawlResult,
  options: AnalyzerOptions
): Promise<ConnectorAnalysis> {
  const model = getModel(options.aiProvider, options.aiModel);

  // Concatenate all documentation content
  const fullDocs = docs.pages
    .map((page) => `## ${page.title}\nURL: ${page.url}\n\n${page.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are an expert API integration developer. Analyze the following API documentation and extract structured information to build a connector.

Documentation:
${fullDocs}

Your task is to:
1. Identify the API name, description, and categorization
2. Determine the authentication method (OAuth2, API Key, Basic Auth, etc.)
3. Extract all available API endpoints and their parameters
4. Identify common actions (CRUD operations)
5. Identify potential sync operations (list/fetch operations)
6. Define the integration configuration (e.g., clientId, clientSecret for OAuth)
7. Define the connection configuration (e.g., accessToken, refreshToken)

${
  options.connectorName
    ? `Use "${options.connectorName}" as the connector name.`
    : "Infer an appropriate connector name from the documentation."
}
${!options.generateActions ? "Skip generating actions." : ""}
${!options.generateSyncs ? "Skip generating syncs." : ""}

Generate a comprehensive connector analysis with all necessary fields.`;

  const { object } = await generateObject({
    model,
    schema: ConnectorAnalysisSchema,
    prompt,
  });

  return object as ConnectorAnalysis;
}
