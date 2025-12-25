import { Connection } from "@databite/types";
import { ConnectionStore, PaginationParams, PaginatedResponse } from "./types";

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

  async readAll(
    params?: PaginationParams
  ): Promise<PaginatedResponse<Connection<any>>> {
    const allConnections = Array.from(this.connections.values());
    const total = allConnections.length;

    // Default pagination values
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Slice the data for the current page
    const data = allConnections.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
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
