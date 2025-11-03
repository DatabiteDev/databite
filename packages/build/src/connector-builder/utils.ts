import { Connector } from "@databite/types";
import { z } from "zod";

/**
 * Validates a Connector definition to ensure it's well-formed.
 */
export function validateConnector<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(Connector: Connector<TIntegrationConfig, TConnectionConfig>): string[] {
  const errors: string[] = [];

  if (!Connector.id?.trim()) {
    errors.push("Connector must have a non-empty id");
  }

  if (!Connector.name?.trim()) {
    errors.push("Connector must have a non-empty name");
  }

  if (!Connector.version?.trim()) {
    errors.push("Connector must have a non-empty version");
  }

  // Validate configs
  if (!Connector.integrationConfig) {
    errors.push("Connector must have a non-empty integrationConfig");
  }
  if (!Connector.connectionConfig) {
    errors.push("Connector must have a non-empty connectionConfig");
  }

  return errors;
}

/**
 * Execute function with retries and timeout
 */
export async function executeWithRetries<T>(
  fn: () => Promise<T>,
  retries: number,
  timeout: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Execution timeout")), timeout)
        ),
      ]);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.warn(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
        );
      }
    }
  }

  throw lastError!;
}
