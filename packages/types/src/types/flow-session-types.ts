import { FlowStepResult } from "./flow-types";

/**
 * Represents a server-side flow execution session
 */
export interface FlowSession {
  /** Unique session identifier */
  id: string;
  /** Name of the flow being executed */
  flowName: string;
  /** Current step index in the flow */
  currentStepIndex: number;
  /** Name of the current block being executed */
  currentBlockName: string;
  /** Accumulated context from all completed steps */
  context: Record<string, any>;
  /** Results from all completed steps */
  steps: FlowStepResult[];
  /** Whether the flow has completed */
  isComplete: boolean;
  /** Error message if the flow failed */
  error?: string;
  /** Timestamp when the session was created */
  createdAt: number;
}

/**
 * Response from executing a flow step
 */
export interface FlowStepResponse {
  /** Session identifier */
  sessionId: string;
  /** Whether the flow has completed */
  isComplete: boolean;
  /** Whether the flow/step executed successfully */
  success: boolean;
  /** Final result data if flow is complete */
  data?: any;
  /** Error message if failed */
  error?: string;

  /** Information about the next step to render (if not complete) */
  nextStep?: {
    /** Name of the block to render */
    blockName: string;
    /** Whether this block requires user interaction */
    requiresInteraction: boolean;
    /** Human-readable label for the block */
    label: string;
    /** Optional description */
    description?: string;
    /** Configuration for rendering the block */
    renderConfig?: {
      type: "form" | "confirm" | "display" | "oauth" | "custom";
      config: any;
    };
  };
}

/**
 * Request to start a new flow session
 */
export interface StartFlowRequest {
  /** ID of the integration to authenticate */
  integrationId: string;
}

/**
 * Request to execute a flow step
 */
export interface ExecuteStepRequest {
  /** User input for interactive blocks */
  input?: any;
}
