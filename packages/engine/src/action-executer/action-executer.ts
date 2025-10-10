import { Connection, Integration, Connector } from "@databite/types";
import { IntegrationRateLimiter } from "../rate-limiter/rate-limiter";

export interface ActionExecutorConfig {
  getConnection: (id: string) => Connection<any> | undefined;
  getIntegration: (id: string) => Integration<any> | undefined;
  getConnector: (id: string) => Connector<any, any> | undefined;
  rateLimiter?: IntegrationRateLimiter;
}

export class ActionExecutor {
  private getConnection: (id: string) => Connection<any> | undefined;
  private getIntegration: (id: string) => Integration<any> | undefined;
  private getConnector: (id: string) => Connector<any, any> | undefined;
  private rateLimiter: IntegrationRateLimiter;

  constructor(config: ActionExecutorConfig) {
    this.getConnection = config.getConnection;
    this.getIntegration = config.getIntegration;
    this.getConnector = config.getConnector;
    this.rateLimiter = config.rateLimiter || new IntegrationRateLimiter();
  }

  async executeAction(
    connectionId: string,
    actionName: string,
    params: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
  }> {
    const startTime = Date.now();

    try {
      const connection = this.getConnection(connectionId);
      if (!connection) {
        throw new Error(`Connection '${connectionId}' not found`);
      }

      const integration = this.getIntegration(connection.integrationId);
      if (!integration) {
        throw new Error(`Integration '${connection.integrationId}' not found`);
      }

      const connector = this.getConnector(integration.connectorId);
      if (!connector) {
        throw new Error(`Connector '${integration.connectorId}' not found`);
      }

      const action = connector.actions[actionName];
      if (!action) {
        throw new Error(
          `Action '${actionName}' not found in connector '${connector.id}'`
        );
      }

      // Apply rate limiting
      if (connector.rateLimit) {
        const key = this.rateLimiter.generateKey(
          connector.rateLimit.strategy ?? "per-integration",
          connector.id,
          connectionId,
          connection.integrationId
        );

        const limitResult = await this.rateLimiter.checkLimit(
          key,
          connector.rateLimit
        );

        if (!limitResult.allowed) {
          throw new Error(
            `Rate limit exceeded for integration '${
              integration.name
            }'. Try again after ${new Date(
              limitResult.resetTime
            ).toISOString()}`
          );
        }
      }

      // Execute the action
      const result = await action.handler(params, connection);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `Action '${actionName}' failed for connection '${connectionId}':`,
        error
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }
}
