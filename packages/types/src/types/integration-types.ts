import { z } from "zod";

/**
 * Represents a connector integration - a configured instance of a connector
 * with specific values filled in for properties and configurations.
 * Integrations can have multiple connections (authenticated instances).
 */
export interface Integration<TIntegrationConfig extends z.ZodType> {
  id: string;
  name: string;
  connectorId: string;
  config: z.infer<TIntegrationConfig>;
}
