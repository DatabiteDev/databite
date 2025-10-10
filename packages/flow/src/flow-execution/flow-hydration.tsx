"use client";

import type { Flow, FlowBlock, BlockRenderProps } from "@databite/types";
import { z } from "zod";
import { useMemo } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Auto-hydrate flow blocks with render functions based on renderConfig
 */
export function useHydratedFlow<
  FlowReturnType extends z.ZodType,
  TBlocks extends Record<string, FlowBlock<any, any>>
>(
  flow: Flow<FlowReturnType, TBlocks>
): Flow<FlowReturnType, Record<string, FlowBlock<any, any>>> {
  return useMemo(() => {
    const hydratedBlocks: Record<string, FlowBlock<any, any>> = {};

    for (const [blockName, block] of Object.entries(flow.blocks)) {
      if (block.renderConfig && !block.render) {
        hydratedBlocks[blockName] = {
          ...block,
          render: createRenderFunction(block.renderConfig),
        };
      } else {
        hydratedBlocks[blockName] = block;
      }
    }

    return {
      name: flow.name,
      blocks: hydratedBlocks,
      blockOrder: flow.blockOrder as string[] | undefined,
      returnTransform: flow.returnTransform as
        | ((context: any) => any)
        | undefined,
    };
  }, [flow]);
}

/**
 * Creates a render function based on the renderConfig type
 */
function createRenderFunction(renderConfig: {
  type: string;
  config: any;
}): (props: BlockRenderProps) => React.ReactNode {
  const { type, config } = renderConfig;

  switch (type) {
    case "form":
      return createFormRender(config);
    case "confirm":
      return createConfirmRender(config);
    case "display":
      return createDisplayRender(config);
    default:
      return () => null;
  }
}

/**
 * Creates a form render function
 */
function createFormRender(config: any) {
  return (props: BlockRenderProps) => {
    // Create Zod schema from config fields
    const createSchema = () => {
      const schemaFields: any = {};

      config.fields.forEach((field: any) => {
        let fieldSchema: any;

        switch (field.type) {
          case "email":
            fieldSchema = z
              .string()
              .email("Please enter a valid email address");
            break;
          case "number":
            fieldSchema = z.coerce.number();
            break;
          case "url":
            fieldSchema = z.string().url("Please enter a valid URL");
            break;
          default:
            fieldSchema = z.string();
        }

        if (field.required) {
          if (fieldSchema instanceof z.ZodString) {
            fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          }
        } else {
          fieldSchema = fieldSchema.optional();
        }

        schemaFields[field.name] = fieldSchema;
      });

      return z.object(schemaFields);
    };

    const schema = createSchema();

    const form = useForm({
      resolver: zodResolver(schema as any),
      defaultValues: (() => {
        const initial: any = {};
        config.fields.forEach((field: any) => {
          initial[field.name] =
            field.defaultValue !== undefined ? field.defaultValue : "";
        });
        return initial;
      })(),
    });

    const onSubmit = (data: any) => {
      props.onComplete(data);
    };

    return (
      <div className="w-full max-w-md mx-auto p-6">
        {config.title && (
          <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
        )}
        {config.description && (
          <p className="text-muted-foreground mb-6">{config.description}</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {config.fields.map((field: any) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        {...formField}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" className="w-full">
              {config.submitLabel || "Continue"}
            </Button>
          </form>
        </Form>
      </div>
    );
  };
}

/**
 * Creates a confirm render function
 */
function createConfirmRender(config: any) {
  return ({ context, onComplete }: BlockRenderProps) => {
    const message =
      typeof config.message === "function"
        ? config.message(context)
        : config.message;

    return (
      <div className="w-full max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
        <p className="text-muted-foreground mb-6 whitespace-pre-wrap break-words break-all overflow-x-auto">
          {message}
        </p>

        <div className="flex gap-3">
          <Button
            onClick={() => onComplete(false)}
            variant="outline"
            className="flex-1"
          >
            {config.cancelLabel || "Cancel"}
          </Button>
          <Button onClick={() => onComplete(true)} className="flex-1">
            {config.confirmLabel || "Confirm"}
          </Button>
        </div>
      </div>
    );
  };
}

/**
 * Creates a display render function
 */
function createDisplayRender(config: any) {
  return ({ context, onComplete }: BlockRenderProps) => {
    const content =
      typeof config.content === "function"
        ? config.content(context)
        : config.content;

    return (
      <div className="w-full max-w-md mx-auto p-6">
        {config.title && (
          <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
        )}
        <p className="text-muted-foreground mb-6 whitespace-pre-wrap break-words break-all overflow-x-auto">
          {content}
        </p>
        <Button onClick={() => onComplete(undefined)} className="w-full">
          {config.continueLabel || "Continue"}
        </Button>
      </div>
    );
  };
}
