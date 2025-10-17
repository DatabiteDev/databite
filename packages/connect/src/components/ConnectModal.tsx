import type { Connector, Integration } from "@databite/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowRenderer } from "@databite/flow";
import { useCallback } from "react";

export interface ConnectModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /**Connector */
  connector: Connector<any, any>;
  /** Integration to display */
  integration: Integration<any>;
  /** Callback when authentication is successful */
  onAuthSuccess: (
    integration: Integration<any>,
    connectionConfig: any
  ) => void | Promise<void>;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  connector,
  integration,
  onAuthSuccess,
  onAuthError,
}: ConnectModalProps) {
  if (
    connector.id !== integration.connectorId ||
    !connector.authenticationFlow
  ) {
    throw new Error(`Connector ${integration.connectorId} not found`);
  }

  const handleComplete = useCallback(
    (result: any) => {
      if (result.success) {
        onAuthSuccess(integration, result.data);
      } else {
        onAuthError?.(new Error(result.error));
      }
    },
    [onAuthSuccess, onAuthError, integration]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 sr-only">
          <DialogTitle className="sr-only">
            Connect to {integration.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Connect to {integration.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-0">
          <img
            src={connector.logo}
            alt={integration.name}
            className="w-10 h-10 rounded-sm mb-4 object-contain"
          />
          <FlowRenderer
            flow={connector.authenticationFlow}
            initialContext={{ integration: integration.config }}
            onComplete={handleComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
