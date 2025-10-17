import { z } from "zod";
import type React from "react";

/**
 * Props for rendering a block in the UI
 */
export interface BlockRenderProps {
  /** The accumulated context from previous blocks */
  context: Record<string, any>;
  /** Function to call when the block is ready to proceed */
  onComplete: (result: any) => void;
  /** Function to call if the block encounters an error */
  onError: (error: string) => void;
}

/**
 * Represents a flow block with typed input and output.
 */
export interface FlowBlock<
  TInput extends z.ZodType,
  TOutput extends z.ZodType
> {
  /** Execute the block logic with the given input context */
  run(input: z.infer<TInput>): Promise<z.infer<TOutput>>;

  /** Optional UI component to render for this block */
  render?: (props: BlockRenderProps) => React.ReactNode;

  /** Whether this block requires user interaction (default: false) */
  requiresInteraction?: boolean;

  /** Human-readable label for display purposes */
  label: string;

  /** Optional description of what this block does */
  description?: string;

  /** Optional configuration for the block's render function */
  renderConfig?: {
    type: string;
    config: any;
  };
}

/**
 * Represents a complete flow definition with typed blocks.
 */
export interface Flow<
  ReturnType extends z.ZodType,
  TBlocks extends Record<string, FlowBlock<z.ZodType, z.ZodType>> = Record<
    string,
    FlowBlock<z.ZodType, z.ZodType>
  >,
  _TInitialContext = {}
> {
  /** The name of this flow */
  name: string;
  /** Collection of blocks keyed by their unique names */
  blocks: TBlocks;
  /**
   * Explicit execution order for blocks.
   */
  blockOrder?: (keyof TBlocks)[];
  /** Function to transform the final context into the return value */
  returnTransform?: (context: Record<string, any>) => z.infer<ReturnType>;
}

/**
 * Represents the result of executing a single block within a flow.
 */
export interface FlowStepResult {
  /** The unique name/key of the block that was executed */
  blockName: string;
  /** Whether this block executed successfully */
  success: boolean;
  /** The output data produced by this block (if successful) */
  data?: any;
  /** Error message if this block failed */
  error?: string;
  /** Time taken to execute this block in milliseconds */
  executionTime: number;
}

/**
 * Represents the overall result of a flow execution.
 */
export interface FlowExecutionResult<TReturn = any> {
  /** Whether the flow completed successfully without errors */
  success: boolean;
  /** The final return value of the flow (transformed if returnTransform is provided) */
  data?: TReturn;
  /** The raw accumulated context object containing all block outputs */
  context?: Record<string, any>;
  /** Error message if the flow failed */
  error?: string;
  /** Detailed results for each block that was executed */
  steps: FlowStepResult[];
  /** Total time taken to execute the flow in milliseconds */
  executionTime: number;
}

/**
 * Represents the current state of a flow execution
 */
export interface FlowState {
  /** Current step index being executed */
  currentStepIndex: number;
  /** Total number of steps in the flow */
  totalSteps: number;
  /** Name of the current block being executed */
  currentBlockName: string;
  /** Whether the flow is currently executing a step */
  isExecuting: boolean;
  /** Whether the flow has completed */
  isComplete: boolean;
  /** Accumulated context from all completed steps */
  context: Record<string, any>;
  /** Results from all completed steps */
  steps: FlowStepResult[];
  /** Current error if any */
  error?: string;
  /** Start time of the flow execution */
  startTime: number;
}
