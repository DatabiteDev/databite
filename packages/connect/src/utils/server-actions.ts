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
  inputSchema: any;
  outputSchema: any;
};

export type SyncMetadata = {
  name: string;
  id: string;
  label: string;
  description?: string;
  maxRetries?: number;
  timeout?: number;
  outputSchema: any;
};

export type SyncWithStatus = SyncMetadata & {
  isActive: boolean;
};

export type JobInfo = {
  id: string;
  connectionId: string;
  syncName: string;
  syncInterval: string;
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

/**
 * Pagination parameters for API requests
 */
export type PaginationParams = {
  page?: number;
  limit?: number;
};

/**
 * Paginated response from the API
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
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

/**
 * Get all syncs for a connector
 */
export async function getConnectorSyncs(
  apiUrl: string,
  connectorId: string
): Promise<SyncMetadata[]> {
  try {
    const response = await fetch(
      `${apiUrl}/api/connectors/${connectorId}/syncs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch connector syncs: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching syncs for connector ${connectorId}:`, error);
    return [];
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
 * Fetch connections from the server with pagination
 */
export async function getConnections(
  apiUrl: string,
  params?: PaginationParams
): Promise<PaginatedResponse<Connection<any>>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const url = `${apiUrl}/api/connections${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
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
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
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
 * Update an existing connection
 */
export async function updateConnection(
  apiUrl: string,
  id: string,
  connection: Connection<any>
): Promise<Connection<any> | null> {
  try {
    const response = await fetch(`${apiUrl}/api/connections/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(connection),
    });

    if (!response.ok) {
      throw new Error(`Failed to update connection: ${response.statusText}`);
    }

    const result = await response.json();
    return result.connection;
  } catch (error) {
    console.error(`Error updating connection ${id}:`, error);
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
// CONNECTION SYNC MANAGEMENT ROUTES
// ============================================================================

/**
 * Get available syncs for a connection with their activation status
 */
export async function getAvailableSyncs(
  apiUrl: string,
  connectionId: string
): Promise<SyncWithStatus[]> {
  try {
    const response = await fetch(
      `${apiUrl}/api/connections/${connectionId}/syncs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch available syncs: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching available syncs for connection ${connectionId}:`,
      error
    );
    return [];
  }
}

/**
 * Activate a sync for a connection
 */
export async function activateSync(
  apiUrl: string,
  connectionId: string,
  syncName: string,
  syncInterval?: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${apiUrl}/api/connections/${connectionId}/syncs/${syncName}/activate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncInterval }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to activate sync");
    }

    return true;
  } catch (error) {
    console.error(
      `Error activating sync ${syncName} for connection ${connectionId}:`,
      error
    );
    throw error;
  }
}

/**
 * Deactivate a sync for a connection
 */
export async function deactivateSync(
  apiUrl: string,
  connectionId: string,
  syncName: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${apiUrl}/api/connections/${connectionId}/syncs/${syncName}/deactivate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to deactivate sync");
    }

    return true;
  } catch (error) {
    console.error(
      `Error deactivating sync ${syncName} for connection ${connectionId}:`,
      error
    );
    throw error;
  }
}

/**
 * Bulk activate multiple syncs for a connection
 */
export async function activateMultipleSyncs(
  apiUrl: string,
  connectionId: string,
  syncNames: string[],
  syncInterval?: number
): Promise<{
  succeeded: string[];
  failed: Array<{ sync: string; error: string }>;
}> {
  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ sync: string; error: string }>,
  };

  for (const syncName of syncNames) {
    try {
      await activateSync(apiUrl, connectionId, syncName, syncInterval);
      results.succeeded.push(syncName);
    } catch (error) {
      results.failed.push({
        sync: syncName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Bulk deactivate multiple syncs for a connection
 */
export async function deactivateMultipleSyncs(
  apiUrl: string,
  connectionId: string,
  syncNames: string[]
): Promise<{
  succeeded: string[];
  failed: Array<{ sync: string; error: string }>;
}> {
  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ sync: string; error: string }>,
  };

  for (const syncName of syncNames) {
    try {
      await deactivateSync(apiUrl, connectionId, syncName);
      results.succeeded.push(syncName);
    } catch (error) {
      results.failed.push({
        sync: syncName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
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
 * Get all scheduled sync jobs with pagination
 */
export async function getScheduledJobs(
  apiUrl: string,
  params?: PaginationParams
): Promise<PaginatedResponse<JobInfo>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const url = `${apiUrl}/api/sync/jobs${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
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
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
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

/**
 * Schedule syncs for a connection
 * @param syncInterval - Optional custom sync interval in minutes
 * @param syncNames - Optional array of specific sync names to schedule (defaults to activeSyncs)
 */
export async function scheduleConnectionSyncs(
  apiUrl: string,
  connectionId: string,
  syncInterval?: number,
  syncNames?: string[]
): Promise<boolean> {
  try {
    const response = await fetch(
      `${apiUrl}/api/sync/schedule/${connectionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncInterval, syncNames }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to schedule syncs: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error scheduling syncs for connection ${connectionId}:`,
      error
    );
    return false;
  }
}

/**
 * Unschedule all syncs for a connection
 */
export async function unscheduleConnectionSyncs(
  apiUrl: string,
  connectionId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${apiUrl}/api/sync/schedule/${connectionId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to unschedule syncs: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error unscheduling syncs for connection ${connectionId}:`,
      error
    );
    return false;
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
