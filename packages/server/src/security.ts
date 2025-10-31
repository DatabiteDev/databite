import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

export interface SecurityConfig {
  // Rate limiting configuration
  rateLimit?: {
    windowMs?: number;
    max?: number;
    message?: string;
  };

  // Origin whitelist for CORS
  allowedOrigins?: string[];

  // Request size limits
  requestSizeLimit?: string;

  // Enable/disable security features
  enableHelmet?: boolean;
  enableRateLimit?: boolean;

  // IP whitelist/blacklist
  ipWhitelist?: string[];
  ipBlacklist?: string[];

  // Custom request validation
  requestValidator?: (req: Request) => boolean | Promise<boolean>;
}

export class SecurityMiddleware {
  private config: Required<SecurityConfig>;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again later.",
        ...(config.rateLimit ?? {}),
      },
      allowedOrigins: config.allowedOrigins ?? ["http://localhost:*"],
      requestSizeLimit: config.requestSizeLimit ?? "10mb",
      enableHelmet: config.enableHelmet ?? true,
      enableRateLimit: config.enableRateLimit ?? true,
      ipWhitelist: config.ipWhitelist ?? [],
      ipBlacklist: config.ipBlacklist ?? [],
      requestValidator: config.requestValidator ?? ((_req: Request) => true),
    };
  }

  // Helmet for security headers
  getHelmet() {
    if (!this.config.enableHelmet) {
      return (_req: Request, _res: Response, next: NextFunction) => {
        next();
      };
    }

    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  // Rate limiting middleware
  getRateLimiter() {
    if (!this.config.enableRateLimit) {
      return (_req: Request, _res: Response, next: NextFunction) => {
        next();
      };
    }

    return rateLimit({
      windowMs: this.config.rateLimit.windowMs!,
      max: this.config.rateLimit.max!,
      message: this.config.rateLimit.message,
      standardHeaders: true,
      legacyHeaders: false,
      // Skip rate limiting for whitelisted IPs
      skip: (req) => {
        const ip = this.getClientIp(req);
        return this.config.ipWhitelist.includes(ip);
      },
    });
  }

  // CORS middleware with origin validation
  getCorsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      // Check if origin is allowed
      if (origin && this.isOriginAllowed(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else if (this.config.allowedOrigins.includes("*")) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }

      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }

      next();
    };
  }

  // IP filtering middleware
  getIpFilter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);

      // Check blacklist first
      if (
        this.config.ipBlacklist.length > 0 &&
        this.config.ipBlacklist.includes(ip)
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Check whitelist if configured
      if (
        this.config.ipWhitelist.length > 0 &&
        !this.config.ipWhitelist.includes(ip)
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      next();
    };
  }

  // Request validation middleware
  getRequestValidator() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const isValid = await this.config.requestValidator(req);
        if (!isValid) {
          res.status(400).json({ error: "Invalid request" });
          return;
        }
        next();
      } catch (error) {
        res.status(400).json({
          error:
            error instanceof Error
              ? error.message
              : "Request validation failed",
        });
      }
    };
  }

  // Input sanitization middleware
  getSanitizer() {
    return (req: Request, _res: Response, next: NextFunction) => {
      // Sanitize query parameters (mutate in place)
      if (req.query && typeof req.query === "object") {
        this.sanitizeObjectInPlace(req.query);
      }

      // Sanitize body (mutate in place)
      if (req.body && typeof req.body === "object") {
        this.sanitizeObjectInPlace(req.body);
      }

      next();
    };
  }

  // Helper: Check if origin is allowed
  private isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed.includes("*")) {
        // Handle wildcard patterns like http://localhost:*
        const pattern = allowed.replace(/\*/g, ".*");
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
  }

  // Helper: Get client IP
  private getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      ""
    );
  }

  // Helper: Sanitize object recursively
  private sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  // Helper: Sanitize object in place (for req.query and req.body)
  private sanitizeObjectInPlace(obj: any): void {
    if (typeof obj !== "object" || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === "string") {
          obj[i] = this.sanitizeValue(obj[i]);
        } else if (typeof obj[i] === "object" && obj[i] !== null) {
          this.sanitizeObjectInPlace(obj[i]);
        }
      }
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        obj[key] = this.sanitizeValue(value);
      } else if (typeof value === "object" && value !== null) {
        this.sanitizeObjectInPlace(value);
      }
    }
  }

  // Helper: Sanitize individual values
  private sanitizeValue(value: any): any {
    if (typeof value !== "string") return value;

    // Remove potential XSS vectors
    return value
      .replace(/[<>]/g, "") // Remove < and >
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  }
}

// Endpoint-specific rate limiters
export const createEndpointLimiter = (
  windowMs: number = 60000, // 1 minute
  max: number = 10
) => {
  return rateLimit({
    windowMs,
    max,
    message: "Too many requests to this endpoint, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Strict limiter for sensitive operations
export const strictLimiter = createEndpointLimiter(60000, 5);

// Moderate limiter for regular operations
export const moderateLimiter = createEndpointLimiter(60000, 30);
