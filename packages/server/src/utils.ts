import { Connector, ConnectorCategory } from "@databite/types";

// Type for sanitized connector metadata (API-safe)
export interface ConnectorMetadata {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  documentationUrl?: string;
  version: string;
  author?: string;
  tags?: string[];
  categories: ConnectorCategory[];
  rateLimit?: {
    requests: number;
    windowMs: number;
    strategy?: "per-integration" | "per-connection";
  };
  actions: {
    id: string;
    label: string;
    description: string;
    maxRetries: number;
    timeout: number;
  }[];
  syncs: {
    id: string;
    label: string;
    description: string;
    maxRetries: number;
    timeout: number;
  }[];
}

// Helper function to sanitize connector for API response
export function sanitizeConnector(
  connector: Connector<any, any>
): ConnectorMetadata {
  const result: ConnectorMetadata = {
    id: connector.id,
    name: connector.name,
    version: connector.version,
    categories: connector.categories,
    actions: Object.entries(connector.actions).map(([key, action]) => ({
      id: action.id,
      name: key,
      label: action.label,
      description: action.description,
      maxRetries: action.maxRetries,
      timeout: action.timeout,
    })),
    syncs: Object.entries(connector.syncs).map(([key, sync]) => ({
      id: sync.id,
      name: key,
      label: sync.label,
      description: sync.description,
      maxRetries: sync.maxRetries,
      timeout: sync.timeout,
    })),
  };

  // Only add optional properties if they exist
  if (connector.description !== undefined) {
    result.description = connector.description;
  }
  if (connector.logo !== undefined) {
    result.logo = connector.logo;
  }
  if (connector.documentationUrl !== undefined) {
    result.documentationUrl = connector.documentationUrl;
  }
  if (connector.author !== undefined) {
    result.author = connector.author;
  }
  if (connector.tags !== undefined) {
    result.tags = connector.tags;
  }
  if (connector.rateLimit !== undefined) {
    result.rateLimit = connector.rateLimit;
  }

  return result;
}

// Helper function to sanitize multiple connectors
export function sanitizeConnectors(
  connectors: Connector<any, any>[]
): ConnectorMetadata[] {
  return connectors.map((connector) => sanitizeConnector(connector));
}
