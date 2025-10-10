import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectModal } from "../components/ConnectModal";
import { Integration } from "@databite/types";

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
    }
  }
}

// Mock the connectors module
jest.mock("@databite/connectors", () => ({
  slack: {
    id: "slack",
    name: "Slack",
    authenticationFlow: {
      id: "slack-auth",
      name: "Slack Authentication",
      blocks: [],
    },
  },
}));

// Mock the FlowRenderer component
jest.mock("@databite/flow", () => ({
  FlowRenderer: ({ onComplete }: { onComplete: (result: any) => void }) => (
    <div data-testid="flow-renderer">
      <button
        onClick={() =>
          onComplete({ success: true, data: { token: "test-token" } })
        }
      >
        Complete Auth
      </button>
      <button
        onClick={() =>
          onComplete({ success: false, error: "Authentication failed" })
        }
      >
        Fail Auth
      </button>
    </div>
  ),
}));

// Mock the Dialog components
jest.mock("../src/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
}));

describe("ConnectModal", () => {
  const mockIntegration: Integration<any> = {
    id: "test-integration",
    connectorId: "slack",
    name: "Test Integration",
    config: { apiKey: "test-key" },
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    integration: mockIntegration,
    onAuthSuccess: jest.fn(),
    onAuthError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when open", () => {
    render(<ConnectModal {...defaultProps} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("flow-renderer")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ConnectModal {...defaultProps} open={false} />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should call onAuthSuccess when authentication succeeds", async () => {
    render(<ConnectModal {...defaultProps} />);

    const completeButton = screen.getByText("Complete Auth");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).toHaveBeenCalledWith(mockIntegration, {
        token: "test-token",
      });
    });
  });

  it("should call onAuthError when authentication fails", async () => {
    render(<ConnectModal {...defaultProps} />);

    const failButton = screen.getByText("Fail Auth");
    fireEvent.click(failButton);

    await waitFor(() => {
      expect(defaultProps.onAuthError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication failed",
        })
      );
    });
  });

  it("should throw error when connector is not found", () => {
    const integrationWithUnknownConnector = {
      ...mockIntegration,
      connectorId: "unknown-connector",
    };

    expect(() => {
      render(
        <ConnectModal
          {...defaultProps}
          integration={integrationWithUnknownConnector}
        />
      );
    }).toThrow("Connector unknown-connector not found");
  });

  it("should throw error when connector has no authentication flow", () => {
    // Mock connector without authentication flow
    jest.doMock("@databite/connectors", () => ({
      slack: {
        id: "slack",
        name: "Slack",
        // No authenticationFlow
      },
    }));

    expect(() => {
      render(<ConnectModal {...defaultProps} />);
    }).toThrow("Connector slack not found");
  });

  it("should call onOpenChange when dialog is closed", () => {
    render(<ConnectModal {...defaultProps} />);

    const dialog = screen.getByTestId("dialog");
    fireEvent.click(dialog);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should apply correct CSS classes to dialog content", () => {
    render(<ConnectModal {...defaultProps} />);

    const dialogContent = screen.getByTestId("dialog-content");
    expect(dialogContent).toHaveClass(
      "max-w-2xl",
      "max-h-[80vh]",
      "overflow-hidden",
      "flex",
      "flex-col"
    );
  });
});
