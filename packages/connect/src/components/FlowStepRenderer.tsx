"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { handleOAuthFlow } from "./handle-oauth-flow";

export interface FlowStepRendererProps {
  step: {
    blockName: string;
    requiresInteraction: boolean;
    label: string;
    description?: string;
    renderConfig?: {
      type: "form" | "confirm" | "display" | "oauth" | "custom";
      config: any;
    };
  };
  onComplete: (result: any) => void;
  onError?: (error: string) => void;
  loading?: boolean;
}

/**
 * Renders a flow step based on its renderConfig
 */
export function FlowStepRenderer({
  step,
  onComplete,
  onError,
  loading = false,
}: FlowStepRendererProps) {
  if (!step.renderConfig) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <p className="text-muted-foreground">
          No render configuration available
        </p>
      </div>
    );
  }

  const { type, config } = step.renderConfig;

  switch (type) {
    case "form":
      return (
        <FormRenderer
          config={config}
          onComplete={onComplete}
          loading={loading}
        />
      );
    case "confirm":
      return (
        <ConfirmRenderer
          config={config}
          onComplete={onComplete}
          loading={loading}
        />
      );
    case "display":
      return (
        <DisplayRenderer
          config={config}
          onComplete={onComplete}
          loading={loading}
        />
      );
    case "oauth":
      return (
        <OAuthRenderer
          config={config}
          onComplete={onComplete}
          onError={onError}
          loading={loading}
        />
      );
    default:
      return (
        <div className="w-full max-w-md mx-auto p-6">
          <p className="text-muted-foreground">Unknown render type: {type}</p>
        </div>
      );
  }
}

/**
 * Form renderer component
 */
function FormRenderer({
  config,
  onComplete,
  loading,
}: {
  config: any;
  onComplete: (data: any) => void;
  loading: boolean;
}) {
  const createSchema = () => {
    const schemaFields: any = {};

    config.fields.forEach((field: any) => {
      let fieldSchema: any;

      switch (field.type) {
        case "email":
          fieldSchema = z.string().email("Please enter a valid email address");
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
    onComplete(data);
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
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : config.submitLabel || "Continue"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

/**
 * Confirm renderer component
 */
function ConfirmRenderer({
  config,
  onComplete,
  loading,
}: {
  config: any;
  onComplete: (confirmed: boolean) => void;
  loading: boolean;
}) {
  const message = typeof config.message === "string" ? config.message : "";

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
      <p className="text-muted-foreground mb-6 whitespace-pre-wrap break-words">
        {message}
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => onComplete(false)}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          {config.cancelLabel || "Cancel"}
        </Button>
        <Button
          onClick={() => onComplete(true)}
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Processing..." : config.confirmLabel || "Confirm"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Display renderer component
 */
function DisplayRenderer({
  config,
  onComplete,
  loading,
}: {
  config: any;
  onComplete: (result: void) => void;
  loading: boolean;
}) {
  const content = typeof config.content === "string" ? config.content : "";

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {config.title && (
        <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
      )}
      <p className="text-muted-foreground mb-6 whitespace-pre-wrap break-words">
        {content}
      </p>
      <Button
        onClick={() => onComplete(null as any)}
        className="w-full"
        disabled={loading}
      >
        {loading ? "Processing..." : config.continueLabel || "Continue"}
      </Button>
    </div>
  );
}

/**
 * OAuth renderer component
 */
function OAuthRenderer({
  config,
  onComplete,
  onError,
  loading,
}: {
  config: any;
  onComplete: (result: any) => void;
  onError?: (error: string) => void;
  loading: boolean;
}) {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOAuth = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const authUrl = typeof config.authUrl === "string" ? config.authUrl : "";

      const result = await handleOAuthFlow({
        authUrl,
        redirectUri: config.redirectUri,
        popupWidth: config.popupWidth,
        popupHeight: config.popupHeight,
        timeout: config.timeout,
        extractParams: config.extractParams,
      });

      setIsAuthenticating(false);

      if (result.success) {
        onComplete(result.data);
      } else {
        const errorMessage = result.error || "Authentication failed";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsAuthenticating(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {config.title && (
        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
      )}
      {config.description && (
        <p className="text-muted-foreground mb-6">{config.description}</p>
      )}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}
      <Button
        onClick={handleOAuth}
        disabled={isAuthenticating || loading}
        className="w-full"
      >
        {isAuthenticating || loading
          ? "Waiting for authentication..."
          : config.buttonLabel || "Connect"}
      </Button>
    </div>
  );
}
