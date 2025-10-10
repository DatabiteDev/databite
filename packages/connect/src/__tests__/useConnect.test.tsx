import { renderHook, act } from "@testing-library/react";
import { useConnect } from "../hooks/useConnect";
import { Integration } from "@databite/types";

describe("useConnect", () => {
  const mockIntegration: Integration<any> = {
    id: "test-integration",
    connectorId: "slack",
    name: "Test Integration",
    config: { apiKey: "test-key" },
  };

  const defaultOptions = {
    onAuthSuccess: jest.fn(),
    onAuthError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with closed state", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.integration).toBe(null);
  });

  it("should open connect modal with integration", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    act(() => {
      result.current.openConnect(mockIntegration);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.integration).toBe(mockIntegration);
  });

  it("should close connect modal", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    // First open the modal
    act(() => {
      result.current.openConnect(mockIntegration);
    });

    expect(result.current.isOpen).toBe(true);

    // Then close it
    act(() => {
      result.current.closeConnect();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.integration).toBe(null);
  });

  it("should toggle connect modal when closed", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    // Set integration first
    act(() => {
      result.current.openConnect(mockIntegration);
    });

    // Close the modal
    act(() => {
      result.current.closeConnect();
    });

    // Toggle should open it
    act(() => {
      result.current.toggleConnect();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.integration).toBe(mockIntegration);
  });

  it("should toggle connect modal when open", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    // Open the modal
    act(() => {
      result.current.openConnect(mockIntegration);
    });

    // Toggle should close it
    act(() => {
      result.current.toggleConnect();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.integration).toBe(null);
  });

  it("should not toggle when no integration is set", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    // Toggle when closed and no integration
    act(() => {
      result.current.toggleConnect();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.integration).toBe(null);
  });

  it("should provide correct modal props", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    act(() => {
      result.current.openConnect(mockIntegration);
    });

    const modalProps = result.current.modalProps;

    expect(modalProps.open).toBe(true);
    expect(modalProps.integration).toBe(mockIntegration);
    expect(modalProps.onAuthSuccess).toBe(defaultOptions.onAuthSuccess);
    expect(modalProps.onAuthError).toBe(defaultOptions.onAuthError);
    expect(typeof modalProps.onOpenChange).toBe("function");
  });

  it("should handle onOpenChange when opening", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    act(() => {
      result.current.openConnect(mockIntegration);
    });

    // Call onOpenChange with true (should not change state since already open)
    act(() => {
      result.current.modalProps.onOpenChange(true);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should handle onOpenChange when closing", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    act(() => {
      result.current.openConnect(mockIntegration);
    });

    // Call onOpenChange with false (should close)
    act(() => {
      result.current.modalProps.onOpenChange(false);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.integration).toBe(null);
  });

  it("should not open when trying to open without integration", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    // Try to open without setting integration first
    act(() => {
      result.current.modalProps.onOpenChange(true);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should maintain integration reference when toggling", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    act(() => {
      result.current.openConnect(mockIntegration);
    });

    const initialIntegration = result.current.integration;

    act(() => {
      result.current.toggleConnect(); // Close
    });

    act(() => {
      result.current.toggleConnect(); // Open again
    });

    expect(result.current.integration).toBe(initialIntegration);
  });

  it("should handle multiple integrations", () => {
    const { result } = renderHook(() => useConnect(defaultOptions));

    const integration1: Integration<any> = {
      id: "integration-1",
      connectorId: "slack",
      name: "Integration 1",
      config: { apiKey: "key1" },
    };

    const integration2: Integration<any> = {
      id: "integration-2",
      connectorId: "trello",
      name: "Integration 2",
      config: { apiKey: "key2" },
    };

    // Open with first integration
    act(() => {
      result.current.openConnect(integration1);
    });

    expect(result.current.integration).toBe(integration1);

    // Open with second integration
    act(() => {
      result.current.openConnect(integration2);
    });

    expect(result.current.integration).toBe(integration2);
  });
});
