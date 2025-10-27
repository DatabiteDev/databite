import { Connector, FlowSession, FlowStepResponse } from "@databite/types";

/**
 * Manages server-side flow execution sessions
 */
export class FlowSessionManager {
  private sessions: Map<string, FlowSession> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Process renderConfig to evaluate function-based properties with session context
   */
  private processRenderConfig(
    renderConfig: any,
    context: Record<string, any>
  ): any {
    if (!renderConfig || !renderConfig.config) {
      return renderConfig;
    }

    const processedConfig = { ...renderConfig.config };

    // Handle OAuth authUrl
    if (
      renderConfig.type === "oauth" &&
      typeof processedConfig.authUrl === "function"
    ) {
      try {
        processedConfig.authUrl = processedConfig.authUrl(context);
      } catch (error) {
        throw new Error(
          `Failed to generate auth URL: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Handle Display content
    if (
      renderConfig.type === "display" &&
      typeof processedConfig.content === "function"
    ) {
      try {
        processedConfig.content = processedConfig.content(context);
      } catch (error) {
        throw new Error(
          `Failed to generate display content: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Handle Confirm message
    if (
      renderConfig.type === "confirm" &&
      typeof processedConfig.message === "function"
    ) {
      try {
        processedConfig.message = processedConfig.message(context);
      } catch (error) {
        throw new Error(
          `Failed to generate confirm message: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      ...renderConfig,
      config: processedConfig,
    };
  }

  /**
   * Create a new flow session
   */
  createSession(
    connectorId: string,
    connector: Connector<any, any>,
    initialContext: Record<string, any>
  ): string {
    const flow = connector.authenticationFlow;
    if (!flow) {
      throw new Error("No authentication flow available");
    }

    const sessionId = `flow_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const blockEntries = flow.blockOrder
      ? flow.blockOrder.map((name) => [name, flow.blocks[name]] as const)
      : Object.entries(flow.blocks);

    if (blockEntries.length === 0) {
      throw new Error("Flow has no blocks");
    }

    const session: FlowSession = {
      id: sessionId,
      flowName: flow.name,
      currentStepIndex: 0,
      currentBlockName: blockEntries[0][0] as string,
      context: { ...initialContext, _connectorId: connectorId },
      steps: [],
      isComplete: false,
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);

    // Auto-cleanup after timeout
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, this.sessionTimeout);

    return sessionId;
  }

  /**
   * Execute the current step in a flow session
   */
  async executeStep(
    sessionId: string,
    connector: Connector<any, any>,
    userInput?: any
  ): Promise<FlowStepResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Flow session not found or expired");
    }

    if (session.isComplete) {
      throw new Error("Flow session already complete");
    }

    const flow = connector.authenticationFlow;
    if (!flow) {
      throw new Error("No authentication flow available");
    }

    const blockEntries = flow.blockOrder
      ? flow.blockOrder.map((name) => [name, flow.blocks[name]] as const)
      : Object.entries(flow.blocks);

    if (session.currentStepIndex >= blockEntries.length) {
      throw new Error("Invalid step index");
    }

    const [blockName, block] = blockEntries[session.currentStepIndex];
    const stepStartTime = Date.now();

    try {
      let result: any;

      if (block.requiresInteraction) {
        // User must provide input for interactive blocks
        if (userInput === undefined) {
          // Don't throw error - instead return the step to render

          // Process renderConfig to evaluate function-based properties
          const processedRenderConfig = block.renderConfig
            ? this.processRenderConfig(block.renderConfig, session.context)
            : undefined;

          const nextStepResponse = {
            blockName: blockName as string,
            requiresInteraction: true as const,
            label: block.label,
            ...(block.description && { description: block.description }),
            ...(processedRenderConfig && {
              renderConfig: processedRenderConfig as {
                type: "form" | "confirm" | "display" | "oauth" | "custom";
                config: any;
              },
            }),
          };

          return {
            sessionId,
            isComplete: false,
            success: true,
            nextStep: nextStepResponse,
          };
        }
        result = userInput;
      } else {
        // Execute non-interactive block server-side
        result = await block.run(session.context);
      }

      // Update session with result
      session.context = { ...session.context, [blockName as string]: result };
      session.steps.push({
        blockName: blockName as string,
        success: true,
        data: result,
        executionTime: Date.now() - stepStartTime,
      });

      const isLastStep = session.currentStepIndex === blockEntries.length - 1;

      if (isLastStep) {
        session.isComplete = true;

        // Apply return transform if available
        let finalData = session.context;
        if (flow.returnTransform) {
          try {
            finalData = flow.returnTransform(session.context);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            session.error = `Return transformation failed: ${errorMessage}`;
            return {
              sessionId,
              isComplete: true,
              success: false,
              error: session.error,
            };
          }
        }

        return {
          sessionId,
          isComplete: true,
          success: true,
          data: finalData,
        };
      }

      // Move to next step
      session.currentStepIndex++;
      session.currentBlockName = blockEntries[
        session.currentStepIndex
      ][0] as string;

      // Check if next step needs interaction or can auto-execute
      const [nextBlockName, nextBlock] = blockEntries[session.currentStepIndex];

      if (!nextBlock.requiresInteraction) {
        // Auto-execute non-interactive blocks recursively
        return await this.executeStep(sessionId, connector);
      }

      // Process renderConfig to evaluate function-based properties
      const processedRenderConfig = nextBlock.renderConfig
        ? this.processRenderConfig(nextBlock.renderConfig, session.context)
        : undefined;

      // Return what to render for the next interactive step
      const nextStepResponse = {
        blockName: nextBlockName as string,
        requiresInteraction: true as const,
        label: nextBlock.label,
        ...(nextBlock.description && { description: nextBlock.description }),
        ...(processedRenderConfig && {
          renderConfig: processedRenderConfig as {
            type: "form" | "confirm" | "display" | "oauth" | "custom";
            config: any;
          },
        }),
      };

      return {
        sessionId,
        isComplete: false,
        success: true,
        nextStep: nextStepResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      session.error = errorMessage;
      session.isComplete = true;
      session.steps.push({
        blockName: blockName as string,
        success: false,
        error: errorMessage,
        executionTime: Date.now() - stepStartTime,
      });

      return {
        sessionId,
        isComplete: true,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a flow session by ID
   */
  getSession(sessionId: string): FlowSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete a flow session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions (for debugging/monitoring)
   */
  getAllSessions(): FlowSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}
