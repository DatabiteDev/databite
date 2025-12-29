import { z } from "zod";

/**
 * Represents a connection - an authenticated instance of an integration.
 * Multiple connections can exist for a single integration.
 */
export interface Connection<TConnectionConfig extends z.ZodType> {
  /** Unique identifier for the connection */
  id: string;
  /** Unique external identifier for the connection */
  externalId: string;
  /** ID of the integration this connection belongs to */
  integrationId: string;
  /** ID of the connector this connection belongs to */
  connectorId: string;
  /** Connector Configuration */
  config: z.infer<TConnectionConfig>;
  /** Default Interval in minutes between syncs */
  syncInterval: number;
  /** Array of sync names that are currently active */
  activeSyncs?: string[];
  /** Metadata for the connection*/
  metadata?: Record<string, any>;
}
