export interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

export class RateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();

  generateKey(
    strategy: "per-integration" | "per-connection",
    connectorId: string,
    connectionId?: string,
    integrationId?: string
  ): string {
    switch (strategy) {
      case "per-connection":
        return `${connectorId}:${connectionId}`;
      case "per-integration":
        return `${connectorId}:${integrationId}`;
      default:
        return connectorId;
    }
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const current = this.limits.get(key);

    if (!current || current.resetTime < now) {
      // Reset window
      this.limits.set(key, { count: 1, resetTime: now + config.windowMs });
      return {
        allowed: true,
        remaining: config.requests - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (current.count >= config.requests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    current.count++;
    return {
      allowed: true,
      remaining: config.requests - current.count,
      resetTime: current.resetTime,
    };
  }
}
