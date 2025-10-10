import { Connection } from "./connection-types";
import { Flow } from "./flow-types";
import { Integration } from "./integration-types";
import { z } from "zod";

/**
 * Represents an action for a connector.
 */
export interface Action<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  id: string;
  label: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  maxRetries: number;
  timeout: number;
  handler: (
    params: z.infer<TInputSchema>,
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TOutputSchema>>;
}

/**
 * Represents a sync for a connector.
 */
export interface Sync<
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  id: string;
  label: string;
  description: string;
  outputSchema: TOutputSchema;
  maxRetries: number;
  timeout: number;
  handler: (
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TOutputSchema>>;
}

/**
 * A connector is simply a function that takes properties and returns a ProjectNode structure.
 * This structure can then be merged into any target project.
 */
export interface Connector<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  /** Unique identifier for the connector */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this connector does */
  description?: string;

  /** The connector's logo */
  logo?: string;

  /** The connector's documentation URL */
  documentationUrl?: string;

  /** Version of the connector */
  version: string;

  /** Connector's author */
  author?: string;

  /** Integration Configuration */
  integrationConfig: TIntegrationConfig;

  /** Connection Configuration */
  connectionConfig: TConnectionConfig;

  /** Connector's authentication flow */
  authenticationFlow?: Flow<TConnectionConfig>;

  /** Connector's refresh action */
  refresh?: (
    connection: Connection<TConnectionConfig>
  ) => Promise<z.infer<TConnectionConfig>>;

  /** Connector's actions */
  actions: {
    [name: string]: Action<z.ZodType, z.ZodType, TConnectionConfig>;
  };

  /** Connector's syncs */
  syncs: {
    [name: string]: Sync<z.ZodType, TConnectionConfig>;
  };

  /** Rate limiting configuration for this connector */
  rateLimit?: {
    requests: number;
    windowMs: number;
    strategy?: "per-integration" | "per-connection";
  };

  /** Optional tags for categorization */
  tags?: string[];

  /** Connector's Categories */
  categories: ConnectorCategory[];

  /** Create Connector's Integration */
  createIntegration: (
    name: string,
    config: z.infer<TIntegrationConfig>
  ) => Integration<TIntegrationConfig>;
}

/**
 * Connector Categories used to categorize connectors.
 */
export type ConnectorCategory =
  | "accounting"
  | "analytics"
  | "ats"
  | "banking"
  | "cms"
  | "communication"
  | "crm"
  | "design"
  | "dev-tools"
  | "e-commerce"
  | "erp"
  | "gaming"
  | "hr"
  | "invoicing"
  | "knowledge-base"
  | "legal"
  | "marketing"
  | "mcp"
  | "other"
  | "payment"
  | "productivity"
  | "search"
  | "social"
  | "sports"
  | "storage"
  | "support"
  | "surveys"
  | "ticketing"
  | "video";
