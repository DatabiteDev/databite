"use client";

import type {
  Flow,
  FlowBlock,
  FlowExecutionResult,
  FlowStepResult,
  FlowState,
} from "@databite/types";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydratedFlow } from "./flow-hydration";

/**
 * Hook for managing flow execution in a UI context.
 */
export function useFlowExecution<
  FlowReturnType extends z.ZodType,
  TBlocks extends Record<string, FlowBlock<any, any>>,
  TInitialContext extends Record<string, any> = {}
>(
  flow: Flow<FlowReturnType, TBlocks, TInitialContext>,
  initialContext: TInitialContext
) {
  const hydratedFlow = useHydratedFlow(flow);

  const [state, setState] = useState<FlowState>(() => {
    const blockEntries = hydratedFlow.blockOrder
      ? hydratedFlow.blockOrder.map(
          (name: string) => [name, hydratedFlow.blocks[name]] as const
        )
      : Object.entries(hydratedFlow.blocks);

    return {
      currentStepIndex: 0,
      totalSteps: blockEntries.length,
      currentBlockName: blockEntries[0]?.[0] as string,
      isExecuting: false,
      isComplete: false,
      context: initialContext,
      steps: [],
      startTime: Date.now(),
    };
  });

  const blockEntries = hydratedFlow.blockOrder
    ? hydratedFlow.blockOrder.map(
        (name: string) => [name, hydratedFlow.blocks[name]] as const
      )
    : Object.entries(hydratedFlow.blocks);

  const currentBlock = blockEntries[state.currentStepIndex];

  /**
   * Execute the current step (for non-interactive blocks).
   */
  const executeCurrentStep = useCallback(async () => {
    if (state.isComplete || state.isExecuting || !currentBlock) return;

    const [blockName, block] = currentBlock;
    setState((prev) => ({ ...prev, isExecuting: true }));

    const stepStartTime = Date.now();

    try {
      const result = await block.run(state.context);
      const stepExecutionTime = Date.now() - stepStartTime;

      const newContext = { ...state.context, [blockName as string]: result };
      const newStep: FlowStepResult = {
        blockName: blockName as string,
        success: true,
        data: result,
        executionTime: stepExecutionTime,
      };

      const isLastStep = state.currentStepIndex === blockEntries.length - 1;

      setState((prev) => ({
        ...prev,
        context: newContext,
        steps: [...prev.steps, newStep],
        currentStepIndex: isLastStep
          ? prev.currentStepIndex
          : prev.currentStepIndex + 1,
        currentBlockName: isLastStep
          ? (blockName as string)
          : (blockEntries[prev.currentStepIndex + 1][0] as string),
        isExecuting: false,
        isComplete: isLastStep,
      }));
    } catch (error) {
      const stepExecutionTime = Date.now() - stepStartTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const newStep: FlowStepResult = {
        blockName: blockName as string,
        success: false,
        error: errorMessage,
        executionTime: stepExecutionTime,
      };

      setState((prev) => ({
        ...prev,
        steps: [...prev.steps, newStep],
        error: errorMessage,
        isExecuting: false,
        isComplete: true,
      }));
    }
  }, [currentBlock, blockEntries]);

  /**
   * Handle completion from an interactive block.
   */
  const handleBlockComplete = useCallback(
    (result: any) => {
      if (!currentBlock) return;
      const [blockName] = currentBlock;
      const stepStartTime = Date.now();
      const stepExecutionTime = Date.now() - stepStartTime;

      const newContext = { ...state.context, [blockName as string]: result };
      const newStep: FlowStepResult = {
        blockName: blockName as string,
        success: true,
        data: result,
        executionTime: stepExecutionTime,
      };

      const isLastStep = state.currentStepIndex === blockEntries.length - 1;

      setState((prev) => ({
        ...prev,
        context: newContext,
        steps: [...prev.steps, newStep],
        currentStepIndex: isLastStep
          ? prev.currentStepIndex
          : prev.currentStepIndex + 1,
        currentBlockName: isLastStep
          ? (blockName as string)
          : (blockEntries[prev.currentStepIndex + 1][0] as string),
        isExecuting: false,
        isComplete: isLastStep,
      }));
    },
    [currentBlock, blockEntries]
  );

  /**
   * Handle error from an interactive block.
   */
  const handleBlockError = useCallback(
    (errorMessage: string) => {
      if (!currentBlock) return;
      const [blockName] = currentBlock;
      const stepStartTime = Date.now();
      const stepExecutionTime = Date.now() - stepStartTime;

      const newStep: FlowStepResult = {
        blockName: blockName as string,
        success: false,
        error: errorMessage,
        executionTime: stepExecutionTime,
      };

      setState((prev) => ({
        ...prev,
        steps: [...prev.steps, newStep],
        error: errorMessage,
        isExecuting: false,
        isComplete: true,
      }));
    },
    [currentBlock]
  );

  /**
   * Start or continue the flow execution.
   */
  const proceed = useCallback(() => {
    if (state.isComplete || !currentBlock) return;

    const [, block] = currentBlock;

    // If block doesn't require interaction, execute automatically
    if (!block.requiresInteraction) {
      executeCurrentStep();
    } else {
      // For interactive blocks, just mark as executing so UI can be shown
      setState((prev) => ({ ...prev, isExecuting: true }));
    }
  }, [state.isComplete, currentBlock, executeCurrentStep]);

  /**
   * Reset the flow to start over.
   */
  const reset = useCallback(() => {
    setState({
      currentStepIndex: 0,
      totalSteps: blockEntries.length,
      currentBlockName: blockEntries[0]?.[0] as string,
      isExecuting: false,
      isComplete: false,
      context: {},
      steps: [],
      startTime: Date.now(),
    });
  }, [blockEntries]);

  /**
   * Get the final execution result with proper return type transformation.
   */
  const getResult = useCallback((): FlowExecutionResult<
    z.infer<FlowReturnType>
  > => {
    const executionTime = Date.now() - state.startTime;

    // If flow has a return transformation, apply it
    let finalData: any;
    if (hydratedFlow.returnTransform && !state.error && state.isComplete) {
      try {
        finalData = hydratedFlow.returnTransform(state.context);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          success: false,
          context: state.context,
          error: `Return transformation failed: ${errorMessage}`,
          steps: state.steps,
          executionTime,
        };
      }
    } else {
      // If no transformation, return the context as-is
      finalData = state.context;
    }

    return {
      success: !state.error && state.isComplete,
      data: finalData,
      context: state.context,
      error: state.error,
      steps: state.steps,
      executionTime,
    };
  }, [state, hydratedFlow]);

  return {
    state,
    currentBlock,
    proceed,
    reset,
    getResult,
    handleBlockComplete,
    handleBlockError,
  };
}

/**
 * Wrapper component that properly handles block rendering with hooks.
 */
function BlockRenderer({
  block,
  context,
  onComplete,
  onError,
}: {
  block: FlowBlock<any, any>;
  context: any;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}) {
  if (!block.render) {
    return (
      <div className="p-6 rounded flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return <>{block.render({ context, onComplete, onError })}</>;
}

/**
 * Component for rendering the current step of a flow.
 * Automatically hydrates the flow with render functions.
 */
export function FlowRenderer<
  FlowReturnType extends z.ZodType,
  TBlocks extends Record<string, FlowBlock<any, any>>
>({
  flow,
  initialContext,
  onComplete,
}: {
  flow: Flow<FlowReturnType, TBlocks>;
  initialContext: Record<string, any>;
  onComplete?: (result: FlowExecutionResult<z.infer<FlowReturnType>>) => void;
}) {
  const {
    state,
    currentBlock,
    proceed,
    handleBlockComplete,
    handleBlockError,
    getResult,
  } = useFlowExecution(flow, initialContext);

  // Auto-proceed for non-interactive blocks
  useEffect(() => {
    if (!state.isExecuting && !state.isComplete) {
      proceed();
    }
  }, [state.isExecuting, state.isComplete, proceed]);

  // Call onComplete when flow finishes
  useEffect(() => {
    if (state.isComplete && onComplete) {
      onComplete(getResult());
    }
  }, [state.isComplete, onComplete]);

  if (state.isComplete) {
    return (
      <div className="p-6 rounded flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!currentBlock) {
    return <Skeleton className="h-32 w-full" />;
  }

  const [, block] = currentBlock;

  // Show loading state for non-interactive blocks that are executing
  if (state.isExecuting && !block.requiresInteraction) {
    return (
      <div className="p-6 rounded flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Use BlockRenderer with a key to force remount on block change
  return (
    <BlockRenderer
      key={`${state.currentBlockName}-${state.currentStepIndex}`}
      block={block}
      context={state.context}
      onComplete={handleBlockComplete}
      onError={handleBlockError}
    />
  );
}
