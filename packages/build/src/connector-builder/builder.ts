import {
  Action,
  Flow,
  Connector,
  Sync,
  Connection,
  ConnectorCategory,
  Integration,
} from "@databite/types";
import { executeWithRetries } from "./utils";
import { z } from "zod";
import { FlowBuilder } from "./flow-builder";

/**
 * Builder class for creating Connector definitions with a fluent API.
 */
export class ConnectorBuilder<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
> {
  private Connector: Partial<Connector<TIntegrationConfig, TConnectionConfig>> =
    {
      tags: [],
      categories: [],
      actions: {},
      syncs: {},
      rateLimit: {
        requests: 100,
        windowMs: 60000,
        strategy: "per-integration",
      },
      createIntegration: (
        name: string,
        config: z.infer<TIntegrationConfig>
      ) => {
        return {
          id: crypto.randomUUID(),
          connectorId: this.Connector.id!,
          name,
          config,
        };
      },
    };

  /**
   * Sets the Connector ID and name.
   */
  withIdentity(id: string, name: string): this {
    this.Connector.id = id;
    this.Connector.name = name;
    return this;
  }

  /**
   * Sets the Connector description.
   */
  withDescription(description: string): this {
    this.Connector.description = description;
    return this;
  }

  /**
   * Sets the Connector author.
   */
  withAuthor(author: string): this {
    this.Connector.author = author;
    return this;
  }

  /**
   * Sets the Connector logo.
   */
  withLogo(logo: string): this {
    this.Connector.logo = logo;
    return this;
  }

  /**
   * Sets the Connector documentation URL.
   */
  withDocumentationUrl(documentationUrl: string): this {
    this.Connector.documentationUrl = documentationUrl;
    return this;
  }

  /**
   * Sets the Connector version.
   */
  withVersion(version: string): this {
    this.Connector.version = version;
    return this;
  }

  /**
   * Adds tags for Connector categorization.
   */
  withTags(...tags: string[]): this {
    this.Connector.tags!.push(...tags);
    return this;
  }

  /** Add Categories to the Connector */
  withCategories(...categories: ConnectorCategory[]): this {
    this.Connector.categories!.push(...categories);
    return this;
  }

  /** Add Integration Configuration */
  withIntegrationConfig(config: TIntegrationConfig): this {
    this.Connector.integrationConfig = config;
    return this;
  }

  /** Add Connection Configuration */
  withConnectionConfig(config: TConnectionConfig): this {
    this.Connector.connectionConfig = config;
    return this;
  }

  /** Register Actions with provided names */
  withActions(actions: {
    [name: string]: Action<z.ZodType, z.ZodType, TConnectionConfig>;
  }): this {
    for (const [name, action] of Object.entries(actions)) {
      this.Connector.actions![name] = action;
    }
    return this;
  }

  /** Register Syncs with provided names */
  withSyncs(syncs: {
    [name: string]: Sync<z.ZodType, TConnectionConfig>;
  }): this {
    for (const [name, sync] of Object.entries(syncs)) {
      this.Connector.syncs![name] = sync;
    }
    return this;
  }

  /**
   * Sets the rate limiting configuration for this connector.
   * Rate limits will be enforced per integration by default.
   */
  withRateLimit(config: {
    requests: number;
    windowMs: number;
    strategy?: "per-integration" | "per-connection";
  }): this {
    this.Connector.rateLimit = {
      ...config,
    };
    return this;
  }

  /** Authentication Flow */
  withAuthenticationFlow<TFlowBuilder>(
    flowName: string,
    builder: (
      flow: FlowBuilder<
        TConnectionConfig,
        { integration: z.infer<TIntegrationConfig> }
      >
    ) => TFlowBuilder & { build(): Flow<TConnectionConfig> }
  ): this {
    const flowBuilder = new FlowBuilder<
      TConnectionConfig,
      { integration: z.infer<TIntegrationConfig> }
    >(flowName).withInitialContext<"integration", z.infer<TIntegrationConfig>>(
      "integration"
    );

    const builtFlow = builder(flowBuilder).build();
    this.Connector.authenticationFlow = builtFlow;

    return this;
  }

  /** Refresh Flow */
  withRefresh(
    refresh: (
      connection: Connection<TConnectionConfig>,
      integration: Integration<TIntegrationConfig>
    ) => Promise<z.infer<TConnectionConfig>>
  ): this {
    this.Connector.refresh = refresh;
    return this;
  }

  /**
   * Builds and returns the complete Connector definition.
   */
  build(): Connector<TIntegrationConfig, TConnectionConfig> {
    if (
      !this.Connector.id ||
      !this.Connector.name ||
      !this.Connector.version ||
      !this.Connector.author ||
      !this.Connector.logo ||
      !this.Connector.documentationUrl ||
      !this.Connector.authenticationFlow ||
      !this.Connector.refresh ||
      !this.Connector.integrationConfig ||
      !this.Connector.connectionConfig
    ) {
      throw new Error(
        "Connector must have id, name, version, author, logo, documentationUrl, authenticationFlow, refresh, integrationConfig and connectionConfig"
      );
    }

    return this.Connector as Connector<TIntegrationConfig, TConnectionConfig>;
  }
}

/**
 * Creates a new Connector builder for defining reusable Connectors.
 *
 * @example
 * ```ts
 * const airtableConnector = createConnector()
 *   .withIdentity("airtable", "Airtable")
 *   .withVersion("1.0.0")
 *   .withVisibility("public")
 *   .withAuthor("John Doe")
 *   .withLogo("https://example.com/logo.png")
 *   .withDocumentationUrl("https://example.com/docs")
 *   .withDescription("Airtable connector")
 *   .withProperty("apiKey", "string", "API Key for Airtable")
 *   .withTags("database", "saas")
 *   .build();
 * ```
 */
export function createConnector<
  TIntegrationConfig extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(): ConnectorBuilder<TIntegrationConfig, TConnectionConfig> {
  return new ConnectorBuilder<TIntegrationConfig, TConnectionConfig>();
}

/** Creates a new Action
 * @param def - The Action definition (without id)
 * @returns The Action with automatically assigned id
 * @example
 * ```ts
 * const action = createAction({
 *   label: "Create User",
 *   description: "Create a new user",
 *   inputSchema: { name: "string" },
 *   outputSchema: { id: "string" },
 *   maxRetries: 3,
 *   timeout: 30000,
 *   handler: async (params, connection) => {
 *     return { id: "123" };
 *   },
 * });
 * ```
 */
export function createAction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(
  def: Omit<Action<TInputSchema, TOutputSchema, TConnectionConfig>, "id">
): Action<TInputSchema, TOutputSchema, TConnectionConfig> {
  const wrappedHandler = async (
    params: z.infer<TInputSchema>,
    connection: Connection<TConnectionConfig>
  ) => {
    return executeWithRetries(
      () => def.handler(params, connection),
      def.maxRetries,
      def.timeout
    );
  };

  return {
    ...def,
    id: crypto.randomUUID(),
    handler: wrappedHandler,
  };
}

/** Creates a new Sync
 * @param def - The Sync definition (without id)
 * @returns The Sync with automatically assigned id
 * @example
 * ```ts
 * const sync = createSync({
 *   label: "Sync Users",
 *   description: "Sync users",
 *   schedule: "0 0 * * *",
 *   outputSchema: { id: "string" },
 *   maxRetries: 3,
 *   timeout: 30000,
 *   handler: async (connection) => {
 *     return [{ id: "123" }];
 *   },
 * });
 * ```
 */
export function createSync<
  TOutputSchema extends z.ZodType,
  TConnectionConfig extends z.ZodType
>(
  def: Omit<Sync<TOutputSchema, TConnectionConfig>, "id">
): Sync<TOutputSchema, TConnectionConfig> {
  const wrappedHandler = async (connection: Connection<TConnectionConfig>) => {
    return executeWithRetries(
      () => def.handler(connection),
      def.maxRetries,
      def.timeout
    );
  };

  return {
    ...def,
    id: crypto.randomUUID(),
    handler: wrappedHandler,
  };
}
