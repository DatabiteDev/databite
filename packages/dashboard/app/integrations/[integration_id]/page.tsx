"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BracesIcon, ChevronLeft, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getIntegration, getConnector } from "@databite/connect";
import { useQuery } from "@tanstack/react-query";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationPage() {
  const params = useParams<{ integration_id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const {
    data: integration,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["integration", params.integration_id],
    queryFn: () => getIntegration(apiUrl, params.integration_id),
    refetchOnWindowFocus: false,
  });

  const { data: connector, isLoading: connectorLoading } = useQuery({
    queryKey: ["connector", integration?.connectorId],
    queryFn: () => getConnector(apiUrl, integration!.connectorId),
    refetchOnWindowFocus: false,
    enabled: !!integration?.connectorId,
  });

  if (isLoading) return <Skeleton className="h-full w-full rounded-md" />;

  if (isError) {
    return (
      <QueryErrorPage
        error={error as Error}
        retry={() => refetch()}
        showDetails={true}
      />
    );
  }

  if (!integration) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-2xl font-bold">Integration not found</h2>
        <p className="text-muted-foreground">
          The integration you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="h-8 px-2 text-muted-foreground !pl-0 hover:text-foreground hover:!bg-background cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-8 overflow-y-scroll">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="h-8 px-2 text-muted-foreground !pl-0 hover:text-foreground hover:!bg-background cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {connector?.logo ? (
            <img
              src={connector.logo}
              alt={integration.name}
              className="w-16 h-16 rounded-lg object-contain bg-muted p-2 border"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {integration.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {integration.name}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {integration.id || "No description provided."}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6 bg-background"
      >
        <TabsList className="grid grid-cols-2 w-2/4 bg-background border p-1 pl-0.5 pr-0.5 pt-0.5 rounded-none">
          <TabsTrigger
            value="general"
            className="flex items-center rounded-none"
          >
            <BracesIcon className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="connector"
            className="flex items-center rounded-none"
          >
            <Settings className="mr-2 h-4 w-4" />
            Connector
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Integration Information</CardTitle>
              <CardDescription>
                Basic information about this integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">
                    {integration.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">ID</label>
                  <p className="text-sm text-muted-foreground">
                    {integration.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Connector ID</label>
                  <p className="text-sm text-muted-foreground">
                    {integration.connectorId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connector" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Associated Connector</CardTitle>
              <CardDescription>
                Details about the connector this integration uses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectorLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : connector ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {connector.logo ? (
                      <img
                        src={connector.logo}
                        alt={connector.name}
                        className="w-12 h-12 rounded-lg object-contain bg-muted p-2 border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {connector.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{connector.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {connector.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium">Version</label>
                      <p className="text-sm text-muted-foreground">
                        {connector.version}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Author</label>
                      <p className="text-sm text-muted-foreground">
                        {connector.author || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categories</label>
                      <p className="text-sm text-muted-foreground">
                        {connector.categories?.length
                          ? connector.categories.join(", ")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <p className="text-sm text-muted-foreground">
                        {connector.tags?.length
                          ? connector.tags.join(", ")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/connectors/${connector.id}`)}
                    className="w-full mt-10 cursor-pointer"
                  >
                    View Connector Details
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Connector not found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
