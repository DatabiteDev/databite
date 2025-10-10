import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  useFlowExecution,
  FlowRenderer,
} from "../flow-execution/flow-execution";
import { Flow } from "@databite/types";

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// Mock the useFlowExecution hook for testing FlowRenderer
jest.mock("../src/flow-execution/flow-execution", () => {
  const actual = jest.requireActual("../src/flow-execution/flow-execution");
  return {
    ...actual,
    useFlowExecution: jest.fn(),
  };
});

const mockUseFlowExecution = useFlowExecution as jest.MockedFunction<
  typeof useFlowExecution
>;

describe("useFlowExecution", () => {
  const mockFlow: Flow<any> = {
    name: "test-flow",
    blocks: {
      step1: {
        run: jest.fn().mockResolvedValue({ result: "step1" }),
        requiresInteraction: false,
      },
      step2: {
        run: jest.fn().mockResolvedValue({ result: "step2" }),
        requiresInteraction: true,
        render: jest.fn(),
      },
    },
    blockOrder: ["step1", "step2"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct state", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    expect(result.current.state.currentStepIndex).toBe(0);
    expect(result.current.state.totalSteps).toBe(2);
    expect(result.current.state.currentBlockName).toBe("step1");
    expect(result.current.state.isExecuting).toBe(false);
    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.state.context).toEqual({});
    expect(result.current.state.steps).toEqual([]);
  });

  it("should execute non-interactive blocks automatically", async () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    act(() => {
      result.current.proceed();
    });

    await waitFor(() => {
      expect(mockFlow.blocks.step1.run).toHaveBeenCalledWith({});
    });

    expect(result.current.state.context).toEqual({
      step1: { result: "step1" },
    });
    expect(result.current.state.currentStepIndex).toBe(1);
    expect(result.current.state.currentBlockName).toBe("step2");
  });

  it("should handle interactive blocks", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    // Move to step2 (interactive)
    act(() => {
      result.current.proceed();
    });

    act(() => {
      result.current.proceed(); // This should not execute step2 automatically
    });

    expect(mockFlow.blocks.step2.run).not.toHaveBeenCalled();
    expect(result.current.state.isExecuting).toBe(true);
  });

  it("should handle block completion", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    act(() => {
      result.current.handleBlockComplete({ result: "completed" });
    });

    expect(result.current.state.context).toEqual({
      step1: { result: "completed" },
    });
    expect(result.current.state.steps).toHaveLength(1);
    expect(result.current.state.steps[0].success).toBe(true);
    expect(result.current.state.steps[0].data).toEqual({ result: "completed" });
  });

  it("should handle block errors", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    act(() => {
      result.current.handleBlockError("Test error");
    });

    expect(result.current.state.steps).toHaveLength(1);
    expect(result.current.state.steps[0].success).toBe(false);
    expect(result.current.state.steps[0].error).toBe("Test error");
    expect(result.current.state.error).toBe("Test error");
    expect(result.current.state.isComplete).toBe(true);
  });

  it("should reset flow state", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    // Execute some steps first
    act(() => {
      result.current.handleBlockComplete({ result: "completed" });
    });

    expect(result.current.state.context).toEqual({
      step1: { result: "completed" },
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStepIndex).toBe(0);
    expect(result.current.state.context).toEqual({});
    expect(result.current.state.steps).toEqual([]);
    expect(result.current.state.isComplete).toBe(false);
  });

  it("should get execution result", () => {
    const { result } = renderHook(() => useFlowExecution(mockFlow));

    // Complete the flow
    act(() => {
      result.current.handleBlockComplete({ result: "completed" });
    });

    const executionResult = result.current.getResult();

    expect(executionResult.success).toBe(true);
    expect(executionResult.data).toEqual({ step1: { result: "completed" } });
    expect(executionResult.context).toEqual({ step1: { result: "completed" } });
    expect(executionResult.steps).toHaveLength(1);
    expect(executionResult.executionTime).toBeGreaterThan(0);
  });

  it("should handle return transformation", () => {
    const flowWithTransform: Flow<any> = {
      ...mockFlow,
      returnTransform: (context) => ({
        transformed: true,
        original: context,
      }),
    };

    const { result } = renderHook(() => useFlowExecution(flowWithTransform));

    // Complete the flow
    act(() => {
      result.current.handleBlockComplete({ result: "completed" });
    });

    const executionResult = result.current.getResult();

    expect(executionResult.success).toBe(true);
    expect(executionResult.data).toEqual({
      transformed: true,
      original: { step1: { result: "completed" } },
    });
  });

  it("should handle return transformation errors", () => {
    const flowWithErrorTransform: Flow<any> = {
      ...mockFlow,
      returnTransform: () => {
        throw new Error("Transform error");
      },
    };

    const { result } = renderHook(() =>
      useFlowExecution(flowWithErrorTransform)
    );

    // Complete the flow
    act(() => {
      result.current.handleBlockComplete({ result: "completed" });
    });

    const executionResult = result.current.getResult();

    expect(executionResult.success).toBe(false);
    expect(executionResult.error).toBe(
      "Return transformation failed: Transform error"
    );
  });
});

describe("FlowRenderer", () => {
  const mockFlow: Flow<any> = {
    name: "test-flow",
    blocks: {
      step1: {
        run: jest.fn().mockResolvedValue({ result: "step1" }),
        requiresInteraction: false,
      },
      step2: {
        run: jest.fn().mockResolvedValue({ result: "step2" }),
        requiresInteraction: true,
        render: ({ onComplete, onError }) => (
          <div>
            <button onClick={() => onComplete({ result: "completed" })}>
              Complete
            </button>
            <button onClick={() => onError("Test error")}>Error</button>
          </div>
        ),
      },
    },
    blockOrder: ["step1", "step2"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state for non-interactive blocks", () => {
    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 0,
        totalSteps: 2,
        currentBlockName: "step1",
        isExecuting: true,
        isComplete: false,
        context: {},
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step1", mockFlow.blocks.step1],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: jest.fn(),
      handleBlockComplete: jest.fn(),
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} />);

    expect(
      screen.getByText("Executing: step1 (Step 1 of 2)")
    ).toBeInTheDocument();
  });

  it("should render interactive blocks", () => {
    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: true,
        isComplete: false,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: jest.fn(),
      handleBlockComplete: jest.fn(),
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} />);

    expect(screen.getByText("Step 2 of 2: step2")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("should handle block completion", () => {
    const mockHandleBlockComplete = jest.fn();
    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: true,
        isComplete: false,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: jest.fn(),
      handleBlockComplete: mockHandleBlockComplete,
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} />);

    fireEvent.click(screen.getByText("Complete"));

    expect(mockHandleBlockComplete).toHaveBeenCalledWith({
      result: "completed",
    });
  });

  it("should handle block errors", () => {
    const mockHandleBlockError = jest.fn();
    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: true,
        isComplete: false,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: jest.fn(),
      handleBlockComplete: jest.fn(),
      handleBlockError: mockHandleBlockError,
    });

    render(<FlowRenderer flow={mockFlow} />);

    fireEvent.click(screen.getByText("Error"));

    expect(mockHandleBlockError).toHaveBeenCalledWith("Test error");
  });

  it("should render success state", () => {
    const mockGetResult = jest.fn().mockReturnValue({
      success: true,
      data: { result: "success" },
      context: { step1: { result: "step1" } },
      error: null,
      steps: [],
      executionTime: 1000,
    });

    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: false,
        isComplete: true,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: mockGetResult,
      handleBlockComplete: jest.fn(),
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} />);

    expect(screen.getByText("Flow Complete!")).toBeInTheDocument();
    expect(screen.getByText(/"result": "success"/)).toBeInTheDocument();
  });

  it("should render error state", () => {
    const mockGetResult = jest.fn().mockReturnValue({
      success: false,
      data: null,
      context: { step1: { result: "step1" } },
      error: "Test error",
      steps: [],
      executionTime: 1000,
    });

    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: false,
        isComplete: true,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
        error: "Test error",
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: mockGetResult,
      handleBlockComplete: jest.fn(),
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} />);

    expect(screen.getByText("Flow Error")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("should call onComplete when flow finishes", () => {
    const mockOnComplete = jest.fn();
    const mockGetResult = jest.fn().mockReturnValue({
      success: true,
      data: { result: "success" },
      context: { step1: { result: "step1" } },
      error: null,
      steps: [],
      executionTime: 1000,
    });

    mockUseFlowExecution.mockReturnValue({
      state: {
        currentStepIndex: 1,
        totalSteps: 2,
        currentBlockName: "step2",
        isExecuting: false,
        isComplete: true,
        context: { step1: { result: "step1" } },
        steps: [],
        startTime: Date.now(),
      },
      currentBlock: ["step2", mockFlow.blocks.step2],
      proceed: jest.fn(),
      reset: jest.fn(),
      getResult: mockGetResult,
      handleBlockComplete: jest.fn(),
      handleBlockError: jest.fn(),
    });

    render(<FlowRenderer flow={mockFlow} onComplete={mockOnComplete} />);

    expect(mockOnComplete).toHaveBeenCalledWith({
      success: true,
      data: { result: "success" },
      context: { step1: { result: "step1" } },
      error: null,
      steps: [],
      executionTime: 1000,
    });
  });
});

// Helper function to render hooks
function renderHook(hook: () => any) {
  let result: any;
  const TestComponent = () => {
    result = hook();
    return null;
  };
  render(<TestComponent />);
  return { result };
}
