"use server";

import { Connection, Integration } from "@databite/types";

const API_URL = "http://localhost:3001";

// Type for connector metadata returned from the API
type ConnectorMetadata = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  documentationUrl?: string;
  version: string;
  author?: string;
  tags?: string[];
  categories: any[];
  actions: any[];
  syncs: any[];
};

/**
 * Fetch all integrations from the server
 */
export async function getIntegrations(): Promise<Integration<any>[]> {
  try {
    const response = await fetch(`${API_URL}/api/integrations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch integrations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return [];
  }
}

/**
 * Fetch a single integration by ID
 */
export async function getIntegration(
  id: string
): Promise<Integration<any> | null> {
  try {
    const response = await fetch(`${API_URL}/api/integrations/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch integration: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching integration ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all connectors from the server
 */
export async function getConnectors(): Promise<ConnectorMetadata[]> {
  try {
    const response = await fetch(`${API_URL}/api/connectors`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connectors: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching connectors:", error);
    return [];
  }
}

/**
 * Fetch a single connector by ID
 */
export async function getConnector(
  id: string
): Promise<ConnectorMetadata | null> {
  try {
    const response = await fetch(`${API_URL}/api/connectors/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connector: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching connector ${id}:`, error);
    return null;
  }
}

/**
 * Fetch integrations with their associated connectors
 */
export async function getIntegrationsWithConnectors(): Promise<
  Array<{ connector: ConnectorMetadata; integration: Integration<any> }>
> {
  try {
    const [integrations, connectors] = await Promise.all([
      getIntegrations(),
      getConnectors(),
    ]);

    return integrations
      .map((integration) => {
        const connector = connectors.find(
          (c) => c.id === integration.connectorId
        );
        return connector ? { connector, integration } : null;
      })
      .filter(
        (
          item
        ): item is {
          connector: ConnectorMetadata;
          integration: Integration<any>;
        } => item !== null
      );
  } catch (error) {
    console.error("Error fetching integrations with connectors:", error);
    return [];
  }
}

/**
 * Fetch all connections from the server
 */
export async function getConnections(): Promise<Connection<any>[]> {
  try {
    const response = await fetch(`${API_URL}/api/connections`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connections: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
}

/**
 * Fetch a single connection by ID
 */
export async function getConnection(
  id: string
): Promise<Connection<any> | null> {
  try {
    const response = await fetch(`${API_URL}/api/connections/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connection: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching connection ${id}:`, error);
    return null;
  }
}

/**
 * Add a new connection to the server
 */
export async function addConnection(
  connection: Connection<any>
): Promise<Connection<any> | null> {
  try {
    const response = await fetch(`${API_URL}/api/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(connection),
    });

    if (!response.ok) {
      throw new Error(`Failed to add connection: ${response.statusText}`);
    }

    const result = await response.json();
    return result.connection;
  } catch (error) {
    console.error("Error adding connection:", error);
    return null;
  }
}

/**
 * Remove a connection from the server
 */
export async function removeConnection(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/connections/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to remove connection: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error removing connection ${id}:`, error);
    return false;
  }
}

/**
 * Start a flow session
 */
export async function startFlow(integrationId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/flows/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ integrationId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start flow: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting flow:", error);
    return null;
  }
}

/**
 * Execute a flow step
 */
export async function executeFlowStep(
  sessionId: string,
  input: any
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/flows/${sessionId}/step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute flow step: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error executing flow step:", error);
    return null;
  }
}

/**
 * Get flow session
 */
export async function getFlowSession(sessionId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/flows/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get flow session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching flow session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Get health status
 */
export async function getHealth(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get health: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching health:", error);
    return null;
  }
}
