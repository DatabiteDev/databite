import type { Flow, FlowBlock } from "@databite/types";
import { z } from "zod";

/**
 * Server-safe flow builder - no React dependencies
 */
export class FlowBuilder<FlowReturnType extends z.ZodType, TContext = {}> {
  private name: string;
  private blockDefs: Array<{
    name: string;
    run: (input: any) => Promise<any>;
    requiresInteraction?: boolean;
    label: string;
    description?: string;
    renderConfig?: {
      type: "form" | "confirm" | "display" | "custom";
      config: any;
    };
  }> = [];
  private returnTransform?: (context: TContext) => z.infer<FlowReturnType>;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a custom block to the flow.
   */
  block<TName extends string, TOutput>(
    name: TName,
    run: (input: TContext) => Promise<TOutput>,
    options?: {
      requiresInteraction?: boolean;
      label?: string;
      description?: string;
      renderConfig?: any;
    }
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }> {
    // Create a new builder with the same name
    const builder = new FlowBuilder<
      FlowReturnType,
      TContext & { [K in TName]: TOutput }
    >(this.name);

    // Copy existing block definitions
    builder.blockDefs = [
      ...this.blockDefs,
      {
        name,
        run,
        requiresInteraction: options?.requiresInteraction ?? false,
        label: options?.label ?? name,
        description: options?.description,
        renderConfig: options?.renderConfig,
      },
    ];

    // Copy the return transform
    builder.returnTransform = this.returnTransform as any;

    return builder;
  }

  /**
   * Add a form block for collecting user input.
   */
  form<TName extends string, TOutput extends Record<string, any>>(
    name: TName,
    config: {
      fields: Array<{
        name: keyof TOutput;
        label: string;
        type?: "text" | "email" | "number" | "password" | "tel" | "url";
        placeholder?: string;
        required?: boolean;
        defaultValue?: any;
      }>;
      title?: string;
      description?: string;
      submitLabel?: string;
    }
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }> {
    const run = async () => {
      throw new Error("Form blocks should use onComplete() instead of run()");
    };

    return this.block<TName, TOutput>(name, run, {
      requiresInteraction: true,
      label: config.title || name,
      description: config.description,
      renderConfig: {
        type: "form",
        config,
      },
    });
  }

  /**
   * Add a confirmation block.
   */
  confirm<TName extends string>(
    name: TName,
    config: {
      title: string;
      message: string | ((context: TContext) => string);
      confirmLabel?: string;
      cancelLabel?: string;
    }
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: boolean }> {
    const run = async () => {
      throw new Error(
        "Confirm blocks should use onComplete() instead of run()"
      );
    };

    return this.block<TName, boolean>(name, run, {
      requiresInteraction: true,
      label: config.title,
      description:
        typeof config.message === "string" ? config.message : undefined,
      renderConfig: {
        type: "confirm",
        config,
      },
    });
  }

  /**
   * Add a display block to show information to the user.
   */
  display<TName extends string>(
    name: TName,
    config: {
      title?: string;
      content: string | ((context: TContext) => string);
      continueLabel?: string;
    }
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: void }> {
    const run = async () => {
      throw new Error(
        "Display blocks should use onComplete() instead of run()"
      );
    };

    return this.block<TName, void>(name, run, {
      requiresInteraction: true,
      label: config.title || name,
      description:
        typeof config.content === "string" ? config.content : undefined,
      renderConfig: {
        type: "display",
        config,
      },
    });
  }

  /**
   * Add an HTTP request block.
   */
  http<TName extends string, TOutput extends Record<string, any>>(
    name: TName,
    config: {
      url: string | ((input: TContext) => string);
      returnType: TOutput;
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      headers?:
        | Record<string, string>
        | ((input: TContext) => Record<string, string>);
      body?: Record<string, any> | ((input: TContext) => Record<string, any>);
      timeout?: number;
    }
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }> {
    const run = async (input: TContext) => {
      const url =
        typeof config.url === "function" ? config.url(input) : config.url;
      const headers =
        typeof config.headers === "function"
          ? config.headers(input)
          : config.headers;
      const body =
        typeof config.body === "function" ? config.body(input) : config.body;

      const { method = "GET", timeout = 30000 } = config;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          ...(body && { body: JSON.stringify(body) }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as TOutput;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return this.block(name, run);
  }

  /**
   * Add a transformation block.
   */
  transform<TName extends string, TOutput extends Record<string, any>>(
    name: TName,
    transform: (input: TContext) => TOutput | Promise<TOutput>
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TOutput }> {
    const run = async (input: TContext) => {
      return await transform(input);
    };

    return this.block(name, run);
  }

  /**
   * Add a delay block.
   */
  delay<TName extends string>(
    name: TName,
    milliseconds: number
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TContext }> {
    const run = async (input: TContext) => {
      await new Promise((resolve) => setTimeout(resolve, milliseconds));
      return input;
    };

    return this.block<TName, TContext>(name, run);
  }

  /**
   * Add a logging block for debugging.
   */
  log<TName extends string>(
    name: TName,
    message?: string | ((input: TContext) => string)
  ): FlowBuilder<FlowReturnType, TContext & { [K in TName]: TContext }> {
    const run = async (input: TContext) => {
      if (message) {
        const logMessage =
          typeof message === "function" ? message(input) : message;
        console.log(logMessage, input);
      } else {
        console.log(input);
      }
      return input;
    };

    return this.block<TName, TContext>(name, run);
  }

  /**
   * Specify what the flow should return.
   */
  returns(
    transform: (context: TContext) => z.infer<FlowReturnType>
  ): FlowBuilder<FlowReturnType, TContext> {
    const builder = new FlowBuilder<FlowReturnType, TContext>(this.name);
    builder.blockDefs = [...this.blockDefs];
    builder.returnTransform = transform;
    return builder;
  }

  /**
   * Build the final flow definition.
   */
  build(): Flow<FlowReturnType, Record<string, FlowBlock<any, any>>> {
    const flowBlocks: Record<string, FlowBlock<any, any>> = {};

    for (const blockDef of this.blockDefs) {
      flowBlocks[blockDef.name] = {
        run: blockDef.run,
        requiresInteraction: blockDef.requiresInteraction,
        label: blockDef.label,
        description: blockDef.description,
        renderConfig: blockDef.renderConfig,
      };
    }

    return {
      name: this.name,
      blocks: flowBlocks,
      blockOrder: this.blockDefs.map((b) => b.name),
      returnTransform: this.returnTransform as (context: any) => any,
    };
  }
}

/**
 * Create a flow builder with automatic IDE autocomplete.
 */
export function createFlow<FlowReturnType extends z.ZodType = z.ZodAny>(
  name: string
): FlowBuilder<FlowReturnType, {}> {
  return new FlowBuilder<FlowReturnType, {}>(name);
}
