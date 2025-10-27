"use client";

import React, { useState, useEffect } from "react";
import { ConnectModal } from "@databite/connect";
import { Integration, Connection } from "@databite/types";
import {
  getIntegrationsWithConnectors,
  addConnection,
  getConnections,
} from "./actions";

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

  useEffect(() => {
    const fetchIntegrations = async () => {
      const integrations = await getIntegrationsWithConnectors();
      setIntegrations(integrations);
    };
    fetchIntegrations();
  }, []);

  const handleAuthSuccess = async (connection: Connection<any>) => {
    console.log("Authentication successful:", connection);
    await addConnection(connection);
    console.log(await getConnections());
    setIsModalOpen(false);
  };

  const handleAuthError = (error: Error) => {
    console.log("Authentication failed:", error);
  };

  const handleConnect = async (integration: IntegrationsWithConnector) => {
    setIntegration(integration);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Connect Your Service
        </h1>

        {integration && (
          <ConnectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            integrationId={integration.integration.id}
            baseUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
          />
        )}

        <div className="flex flex-col gap-3">
          {integrations.map((integration, index) => (
            <div
              key={
                integration.integration.id ??
                `${integration.integration.name}-${index}`
              }
              onClick={() => handleConnect(integration)}
              className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
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
      </div>
    </div>
  );
}
