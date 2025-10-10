import { useState, useCallback } from "react";
import type { Integration } from "@databite/types";

export interface UseConnectOptions {
  /** Callback when authentication is successful */
  onAuthSuccess: (
    integration: Integration<any>,
    connectionConfig: any
  ) => void | Promise<void>;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}

export interface UseConnectReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** The currently selected integration */
  integration: Integration<any> | null;
  /** Open the connect modal with a specific integration */
  openConnect: (integration: Integration<any>) => void;
  /** Close the connect modal */
  closeConnect: () => void;
  /** Toggle the connect modal open/closed state */
  toggleConnect: () => void;
  /** Props to pass to the ConnectModal component */
  modalProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    integration: Integration<any> | null;
    onAuthSuccess: (
      integration: Integration<any>,
      connectionConfig: any
    ) => void | Promise<void>;
    onAuthError?: (error: Error) => void;
  };
}

/**
 * Hook for managing the connect modal state and providing easy access to open/close functionality
 *
 * @example
 * ```tsx
 * import { useConnect } from "@databite/connect";
 * import { ConnectModal } from "@databite/connect";
 *
 * function MyComponent() {
 *   const { isOpen, openConnect, closeConnect, modalProps } = useConnect({
 *     onAuthSuccess: (integration, config) => {
 *       console.log("Connected!", integration.name, config);
 *     },
 *     onAuthError: (error) => {
 *       console.error("Connection failed:", error);
 *     }
 *   });
 *
 *   const handleConnect = () => {
 *     openConnect(myIntegration);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleConnect}>Connect to Service</button>
 *       <ConnectModal {...modalProps} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useConnect(options: UseConnectOptions): UseConnectReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [integration, setIntegration] = useState<Integration<any> | null>(null);

  const openConnect = useCallback((newIntegration: Integration<any>) => {
    setIntegration(newIntegration);
    setIsOpen(true);
  }, []);

  const closeConnect = useCallback(() => {
    setIsOpen(false);
    setIntegration(null);
  }, []);

  const toggleConnect = useCallback(() => {
    if (isOpen) {
      closeConnect();
    } else if (integration) {
      openConnect(integration);
    }
  }, [isOpen, integration, openConnect, closeConnect]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // If trying to open but no integration is set, do nothing
        if (!integration) return;
        setIsOpen(true);
      } else {
        closeConnect();
      }
    },
    [integration, closeConnect]
  );

  const modalProps = {
    open: isOpen,
    onOpenChange: handleOpenChange,
    integration,
    onAuthSuccess: options.onAuthSuccess,
    onAuthError: options.onAuthError,
  };

  return {
    isOpen,
    integration,
    openConnect,
    closeConnect,
    toggleConnect,
    modalProps,
  };
}
