import { Connection, Integration } from "@databite/types";

// Type for connector metadata returned from the API
export type ConnectorMetadata = {
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

export type ActionMetadata = {
  name: string;
  id: string;
  label: string;
  description?: string;
  maxRetries?: number;
  timeout?: number;
};

export type JobInfo = {
  id: string;
  connectionId: string;
  syncName: string;
  schedule: string;
  nextRun?: Date;
  lastRun?: Date;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
};

export type StatusResponse = {
  status: string;
  timestamp: string;
  stats: {
    connectors: number;
    integrations: number;
    connections: number;
    scheduledJobs: number;
  };
};

// ============================================================================
// CONNECTOR ROUTES
// ============================================================================

/**
 * Fetch all connectors from the server
 */
export async function getConnectors(
  apiUrl: string
): Promise<ConnectorMetadata[]> {
  try {
    const response = await fetch(`${apiUrl}/api/connectors`, {
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
  apiUrl: string,
  id: string
): Promise<ConnectorMetadata | null> {
  try {
    const response = await fetch(`${apiUrl}/api/connectors/${id}`, {
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

// ============================================================================
// INTEGRATION ROUTES
// ============================================================================

/**
 * Fetch all integrations from the server
 */
export async function getIntegrations(
  apiUrl: string
): Promise<Integration<any>[]> {
  try {
    const response = await fetch(`${apiUrl}/api/integrations`, {
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
  apiUrl: string,
  id: string
): Promise<Integration<any> | null> {
  try {
    const response = await fetch(`${apiUrl}/api/integrations/${id}`, {
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
 * Fetch integrations with their associated connectors
 */
export async function getIntegrationsWithConnectors(
  apiUrl: string
): Promise<
  Array<{ connector: ConnectorMetadata; integration: Integration<any> }>
> {
  try {
    const [integrations, connectors] = await Promise.all([
      getIntegrations(apiUrl),
      getConnectors(apiUrl),
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

// ============================================================================
// CONNECTION ROUTES
// ============================================================================

/**
 * Fetch all connections from the server
 */
export async function getConnections(
  apiUrl: string
): Promise<Connection<any>[]> {
  try {
    const response = await fetch(`${apiUrl}/api/connections`, {
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
  apiUrl: string,
  id: string
): Promise<Connection<any> | null> {
  try {
    const response = await fetch(`${apiUrl}/api/connections/${id}`, {
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
  apiUrl: string,
  connection: Connection<any>
): Promise<Connection<any> | null> {
  try {
    const response = await fetch(`${apiUrl}/api/connections`, {
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
export async function removeConnection(
  apiUrl: string,
  id: string
): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/connections/${id}`, {
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

// ============================================================================
// FLOW ROUTES
// ============================================================================

/**
 * Start a flow session
 */
export async function startFlow(
  apiUrl: string,
  integrationId: string
): Promise<any> {
  try {
    const response = await fetch(`${apiUrl}/api/flows/start`, {
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
  apiUrl: string,
  sessionId: string,
  input: any
): Promise<any> {
  try {
    const response = await fetch(`${apiUrl}/api/flows/${sessionId}/step`, {
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
export async function getFlowSession(
  apiUrl: string,
  sessionId: string
): Promise<any> {
  try {
    const response = await fetch(`${apiUrl}/api/flows/${sessionId}`, {
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
 * Delete a flow session
 */
export async function deleteFlowSession(
  apiUrl: string,
  sessionId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/flows/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flow session: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting flow session ${sessionId}:`, error);
    return false;
  }
}

// ============================================================================
// SYNC ROUTES
// ============================================================================

/**
 * Get all scheduled sync jobs
 */
export async function getScheduledJobs(apiUrl: string): Promise<JobInfo[]> {
  try {
    const response = await fetch(`${apiUrl}/api/sync/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch scheduled jobs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching scheduled jobs:", error);
    return [];
  }
}

/**
 * Get scheduled jobs for a specific connection
 */
export async function getConnectionJobs(
  apiUrl: string,
  connectionId: string
): Promise<JobInfo[]> {
  try {
    const response = await fetch(`${apiUrl}/api/sync/jobs/${connectionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch connection jobs: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching jobs for connection ${connectionId}:`, error);
    return [];
  }
}

/**
 * Execute a sync manually
 */
export async function executeSync(
  apiUrl: string,
  connectionId: string,
  syncName: string
): Promise<any> {
  try {
    const response = await fetch(
      `${apiUrl}/api/sync/execute/${connectionId}/${syncName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute sync: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error executing sync ${syncName} for connection ${connectionId}:`,
      error
    );
    return null;
  }
}

// ============================================================================
// ACTION ROUTES
// ============================================================================

/**
 * Get all actions for a connector
 */
export async function getConnectorActions(
  apiUrl: string,
  connectorId: string
): Promise<ActionMetadata[]> {
  try {
    const response = await fetch(`${apiUrl}/api/actions/${connectorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch actions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching actions for connector ${connectorId}:`,
      error
    );
    return [];
  }
}

/**
 * Execute an action
 */
export async function executeAction(
  apiUrl: string,
  connectionId: string,
  actionName: string,
  params: any
): Promise<any> {
  try {
    const response = await fetch(
      `${apiUrl}/api/actions/execute/${connectionId}/${actionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute action: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error executing action ${actionName} for connection ${connectionId}:`,
      error
    );
    return null;
  }
}

// ============================================================================
// HEALTH ROUTES
// ============================================================================

/**
 * Get health status
 */
export async function getHealth(
  apiUrl: string
): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
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

/**
 * Get server status with statistics
 */
export async function getStatus(
  apiUrl: string
): Promise<StatusResponse | null> {
  try {
    const response = await fetch(`${apiUrl}/api/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching status:", error);
    return null;
  }
}
