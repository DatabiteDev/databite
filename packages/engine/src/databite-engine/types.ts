import { Connection, Connector } from "@databite/types";

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Storage interface for connections that users must implement
 * to integrate with their database of choice
 */
export interface ConnectionStore {
  /**
   * Create a new connection in the database
   */
  create: (connection: Connection<any>) => Promise<Connection<any>>;

  /**
   * Read a connection by ID from the database
   */
  read: (connectionId: string) => Promise<Connection<any> | undefined>;

  /**
   * Read all connections from the database (with optional pagination)
   */
  readAll: (
    params?: PaginationParams
  ) => Promise<PaginatedResponse<Connection<any>>>;

  /**
   * Update an existing connection in the database
   */
  update: (connection: Connection<any>) => Promise<Connection<any>>;

  /**
   * Delete a connection from the database
   */
  delete: (connectionId: string) => Promise<void>;
}

/**
 * Configuration options for the SyncEngine
 */
export interface EngineConfig {
  connectors: Connector<any, any>[];
  connectionStore?: ConnectionStore;
}
