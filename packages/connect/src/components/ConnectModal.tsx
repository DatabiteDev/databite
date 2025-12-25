import type { Connection } from "@databite/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import { FlowStepRenderer } from "./FlowStepRenderer";
import type { FlowStepResponse } from "@databite/types";

export interface ConnectModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Integration ID to authenticate */
  integrationId: string;
  /** Interval in minutes between syncs for the connection*/
  syncInterval: number;
  /** Base URL of the Databite server */
  baseUrl: string;
  /** Callback when authentication is successful and connection is saved */
  onAuthSuccess: (connection: Connection<any>) => void | Promise<void>;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  integrationId,
  syncInterval,
  baseUrl,
  onAuthSuccess,
  onAuthError,
}: ConnectModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    FlowStepResponse["nextStep"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectorLogo, setConnectorLogo] = useState<string | null>(null);
  const [integrationName, setIntegrationName] = useState<string>("");
  const [connectorId, setConnectorId] = useState<string>("");

  // Start flow when modal opens
  useEffect(() => {
    if (!open || !integrationId) return;

    const startFlow = async () => {
      setLoading(true);
      setError(null);
      setSessionId(null);
      setCurrentStep(null);

      try {
        // Fetch integration details for display
        const integrationRes = await fetch(
          `${baseUrl}/api/integrations/${integrationId}`
        );
        if (integrationRes.ok) {
          const integration = await integrationRes.json();
          setIntegrationName(integration.name || "");
          setConnectorId(integration.connectorId);

          // Fetch connector for logo
          const connectorRes = await fetch(
            `${baseUrl}/api/connectors/${integration.connectorId}`
          );
          if (connectorRes.ok) {
            const connector = await connectorRes.json();
            setConnectorLogo(connector.logo || null);
          }
        }

        // Start the flow
        const res = await fetch(`${baseUrl}/api/flows/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ integrationId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to start flow");
        }

        const result: FlowStepResponse = await res.json();

        if (result.isComplete) {
          // Flow completed immediately (no interactive steps)
          await handleFlowComplete(result);
        } else {
          setSessionId(result.sessionId);
          setCurrentStep(result.nextStep || null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start flow";
        setError(errorMessage);
        if (onAuthError) {
          onAuthError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setLoading(false);
      }
    };

    startFlow();
  }, [open, integrationId, baseUrl, onAuthError]);

  const executeStep = useCallback(
    async (input: any) => {
      if (!sessionId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${baseUrl}/api/flows/${sessionId}/step`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to execute step");
        }

        const result: FlowStepResponse = await res.json();

        if (result.isComplete) {
          await handleFlowComplete(result);
        } else {
          setCurrentStep(result.nextStep || null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to execute step";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, baseUrl]
  );

  const handleFlowComplete = useCallback(
    async (result: FlowStepResponse) => {
      if (!result.success || !result.data) {
        onOpenChange(false);
        if (onAuthError) {
          onAuthError(new Error(result.error || "Authentication failed"));
        }
        return;
      }

      try {
        // Create connection object
        const connection: Connection<any> = {
          id: `conn_${integrationId}_${Date.now()}`,
          integrationId,
          connectorId: connectorId,
          syncInterval,
          config: result.data,
        };

        // Save connection to server
        const saveRes = await fetch(`${baseUrl}/api/connections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(connection),
        });

        if (!saveRes.ok) {
          const errorData = await saveRes.json();
          throw new Error(errorData.error || "Failed to save connection");
        }

        // Call success callback with saved connection
        await onAuthSuccess(connection);

        // Close modal
        onOpenChange(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save connection";
        setError(errorMessage);
        if (onAuthError) {
          onAuthError(err instanceof Error ? err : new Error(errorMessage));
        }
        // Don't close modal on save error so user can see the error
      }
    },
    [
      integrationId,
      connectorId,
      baseUrl,
      onAuthSuccess,
      onAuthError,
      onOpenChange,
    ]
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setSessionId(null);
        setCurrentStep(null);
        setError(null);
        setLoading(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 sr-only">
          <DialogTitle className="sr-only">
            Connect to {integrationName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Authenticate with {integrationName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-0">
          {connectorLogo && (
            <img
              src={connectorLogo}
              alt={integrationName}
              className="w-10 h-10 rounded-sm mb-4 object-contain"
            />
          )}

          {loading && !currentStep && (
            <div className="p-6 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-sm text-muted-foreground">
                  {error ? "Saving connection..." : "Loading..."}
                </p>
              </div>
            </div>
          )}

          {currentStep && (
            <FlowStepRenderer
              step={currentStep}
              onComplete={executeStep}
              onError={setError}
              loading={loading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
