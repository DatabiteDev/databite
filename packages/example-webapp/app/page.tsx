"use client";

import React, { useState, useEffect } from "react";
import { ConnectModal } from "@databite/connect";
import { Integration, Connection } from "@databite/types";
import { Button } from "@/components/ui/button";
import {
  getIntegrationsWithConnectors,
  getConnections,
  getConnector,
  executeAction,
  ConnectorMetadata,
} from "@databite/connect";

type IntegrationsWithConnector = {
  connector: ConnectorMetadata;
  integration: Integration<any>;
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integration, setIntegration] =
    useState<IntegrationsWithConnector | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsWithConnector[]>(
    []
  );
  const [connections, setConnections] = useState<Connection<any>[]>([]);
  const [connectorsMap, setConnectorsMap] = useState<
    Map<string, ConnectorMetadata>
  >(new Map());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchIntegrations = async () => {
      const integrations = await getIntegrationsWithConnectors(apiUrl);
      setIntegrations(integrations);
    };
    fetchIntegrations();
  }, [apiUrl]);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const fetchedConnections = await getConnections(apiUrl);
    setConnections(fetchedConnections);

    const map = new Map<string, ConnectorMetadata>();
    for (const conn of fetchedConnections) {
      if (!map.has(conn.connectorId)) {
        const connector = await getConnector(apiUrl, conn.connectorId);
        if (connector) {
          map.set(conn.connectorId, connector);
        }
      }
    }
    setConnectorsMap(map);
  };

  const handleAuthSuccess = async (connection: Connection<any>) => {
    console.log("Authentication successful:", connection);
    await fetchConnections();
    setIsModalOpen(false);
  };

  const handleAuthError = (error: Error) => {
    console.log("Authentication failed:", error);
  };

  const handleConnect = async (integration: IntegrationsWithConnector) => {
    setIntegration(integration);
    setIsModalOpen(true);
  };

  const handleExecuteAction = async (
    connectionId: string,
    actionName: string
  ) => {
    try {
      const result = await executeAction(apiUrl, connectionId, actionName, {
        channelId: "C09LLSPQVHA",
        text: "Hello World!",
      });
      console.log(`Action "${actionName}" result:`, result);
    } catch (error) {
      console.error(`Error executing action "${actionName}":`, error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-4xl">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Connect Your Service
        </h1>

        {integration && (
          <ConnectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            integrationId={integration.integration.id}
            baseUrl={apiUrl}
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
          />
        )}

        <div className="flex flex-col gap-3 mb-8">
          {integrations.map((integration, index) => (
            <div
              key={
                integration.integration.id ??
                `${integration.integration.name}-${index}`
              }
              onClick={() => handleConnect(integration)}
              className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <img
                src={integration.connector.logo}
                alt={integration.integration.name}
                className="w-8 h-8 rounded object-contain"
              />
              <p className="text-gray-800 font-medium">
                {integration.integration.name}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Active Connections
          </h2>
          {connections.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No active connections yet. Connect a service above to get started.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {connections.map((connection) => {
                const connector = connectorsMap.get(connection.connectorId);
                const isSlack =
                  connection.connectorId.toLowerCase() === "slack";
                const filteredActions =
                  isSlack && connector?.actions
                    ? connector.actions.filter(
                        (action: any) => action.name === "Send Message"
                      )
                    : [];

                return (
                  <div
                    key={connection.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {connector?.logo && (
                        <img
                          src={connector.logo}
                          alt={connector.name}
                          className="w-8 h-8 rounded object-contain"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {connector?.name || connection.connectorId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {connection.id}
                        </p>
                      </div>
                    </div>

                    {filteredActions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Available Actions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {filteredActions.map((action: any) => (
                            <Button
                              key={action.name}
                              onClick={() =>
                                handleExecuteAction(connection.id, action.name)
                              }
                              variant="outline"
                              size="sm"
                            >
                              {action.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No actions available for this connector
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
