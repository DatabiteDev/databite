"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QueryErrorPageProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  retry?: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
}

export function QueryErrorPage({
  error,
  resetErrorBoundary,
  retry,
  title = "Something went wrong",
  description = "We encountered an error while fetching your data.",
  showDetails = false,
}: QueryErrorPageProps) {
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    if (error && showDetails) {
      setErrorDetails(error.message || "Unknown error");
    }
  }, [error, showDetails]);

  const handleRetry = () => {
    if (retry) {
      retry();
    }
    if (resetErrorBoundary) {
      resetErrorBoundary();
    }
  };

  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {showDetails && errorDetails && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2 break-words text-sm">
                {errorDetails}
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            You can try refreshing the page or clicking the retry button below.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          {(retry || resetErrorBoundary) && (
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
