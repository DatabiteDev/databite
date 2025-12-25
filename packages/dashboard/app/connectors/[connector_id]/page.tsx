"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BracesIcon, ChevronLeft, Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SyncsTable from "./components/syncs-table";
import ActionsTable from "./components/actions-table";
import { getConnector } from "@databite/connect";
import { useQuery } from "@tanstack/react-query";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectorPage() {
  const params = useParams<{ connector_id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const {
    data: connector,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["connector", params.connector_id],
    queryFn: () => getConnector(apiUrl, params.connector_id),
    refetchOnWindowFocus: false,
  });

  // Show loading skeleton while fetching
  if (isLoading) return <Skeleton className="h-full w-full rounded-md" />;

  // Show error page if there is an error
  if (isError) {
    return (
      <QueryErrorPage
        error={error as Error}
        retry={() => refetch()}
        showDetails={true}
      />
    );
  }

  if (!connector) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-2xl font-bold">Connector not found</h2>
        <p className="text-muted-foreground">
          The connector you're looking for doesn't exist.
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
          {connector.logo ? (
            <img
              src={connector.logo}
              alt={connector.name}
              className="w-16 h-16 rounded-lg object-contain bg-muted p-2 border"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {connector.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold tracking-tight">
                {connector.name}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {connector.description || "No description provided."}
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
        <TabsList className="grid grid-cols-3 w-2/4 bg-background border p-1 pl-0.5 pr-0.5 pt-0.5 rounded-none">
          <TabsTrigger
            value="general"
            className="flex items-center rounded-none"
          >
            <BracesIcon className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="syncs" className="flex items-center rounded-none">
            <BracesIcon className="mr-2 h-4 w-4" />
            Syncs
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="flex items-center rounded-none"
          >
            <Radio className="mr-2 h-4 w-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Connector Information</CardTitle>
              <CardDescription>
                Basic information about this connector
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">
                    {connector.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">ID</label>
                  <p className="text-sm text-muted-foreground">
                    {connector.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Categories</label>
                  <p className="text-sm text-muted-foreground">
                    {connector.categories && connector.categories.length > 0
                      ? connector.categories.join(", ")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <p className="text-sm text-muted-foreground">
                    {connector.tags?.length ? connector.tags.join(", ") : "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {connector.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syncs" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Syncs</CardTitle>
              <CardDescription>
                Available syncs for this connector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncsTable connector={connector} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Available actions for this connector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionsTable connector={connector} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
