import { Connection } from "@databite/types";
import { ConnectionStore } from "./types";

/**
 * Simple in-memory implementation of ConnectionStore
 * Stores connections in a Map - data is lost on server restart
 */
export class InMemoryConnectionStore implements ConnectionStore {
  private connections: Map<string, Connection<any>> = new Map();

  async create(connection: Connection<any>): Promise<Connection<any>> {
    if (this.connections.has(connection.id)) {
      throw new Error(`Connection ${connection.id} already exists`);
    }
    this.connections.set(connection.id, connection);
    return connection;
  }

  async read(connectionId: string): Promise<Connection<any> | undefined> {
    return this.connections.get(connectionId) || undefined;
  }

  async readAll(): Promise<Connection<any>[]> {
    return Array.from(this.connections.values());
  }

  async update(connection: Connection<any>): Promise<Connection<any>> {
    if (!this.connections.has(connection.id)) {
      throw new Error(`Connection ${connection.id} not found`);
    }
    this.connections.set(connection.id, connection);
    return connection;
  }

  async delete(connectionId: string): Promise<void> {
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    this.connections.delete(connectionId);
  }
}
