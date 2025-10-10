"use client";

import React, { useState, useEffect } from "react";
import { ConnectModal } from "@databite/connect";
import { slack } from "@databite/connectors";
import { Integration } from "@databite/types";
import { Button } from "@/components/ui/button";
import { getConnectors } from "./server-action";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integration, setIntegration] = useState<Integration<any> | null>(null);
  const myIntegration = slack.createIntegration("Slack", {
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  });
  const [connectors, setConnectors] = useState<
    {
      id: string;
      name: string;
      logo: string | undefined;
    }[]
  >([]);

  useEffect(() => {
    const fetchConnectors = async () => {
      const connectors = await getConnectors();
      console.log(connectors);
      setConnectors(connectors);
    };
    fetchConnectors();
  }, []);

  const handleAuthSuccess = async (
    integration: Integration<any>,
    connectionConfig: any
  ) => {
    console.log("Authentication successful:", {
      integration,
      connectionConfig,
    });
    setIsModalOpen(false);
  };

  const handleAuthError = (error: Error) => {
    console.error("Authentication failed:", error);
  };

  const handleConnect = (integration: Integration<any>) => {
    setIntegration(integration);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Connect Your Service
        </h1>

        <Button
          onClick={() => handleConnect(myIntegration)}
          className="w-full mb-8 py-6 text-lg font-medium cursor-pointer"
        >
          Connect to Slack
        </Button>

        {integration && (
          <ConnectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            integration={integration}
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
          />
        )}

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Available Connectors
          </h2>
          <div className="flex flex-col gap-3">
            {connectors.map((connector, index) => (
              <div
                key={connector.id ?? `${connector.name}-${index}`}
                className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <img
                  src={connector.logo}
                  alt={connector.name}
                  className="w-8 h-8 rounded object-contain"
                />
                <p className="text-gray-800 font-medium">{connector.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
