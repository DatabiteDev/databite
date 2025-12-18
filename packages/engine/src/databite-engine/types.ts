import { Connection, Connector } from "@databite/types";

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
   * Read all connections from the database
   */
  readAll: () => Promise<Connection<any>[]>;

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
  minutesBetweenSyncs: number;
}
