"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BracesIcon,
  ChevronLeft,
  Braces,
  ExternalLink,
  Settings,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getConnection,
  getConnectionJobs,
  getIntegration,
  getConnector,
  getAvailableSyncs,
  activateSync,
  deactivateSync,
} from "@databite/connect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DeleteConnectionButton } from "./components/delete-connection-button";
import { toast } from "sonner";

export default function ConnectionPage() {
  const params = useParams<{ connection_id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [syncIntervalDialogOpen, setSyncIntervalDialogOpen] = useState(false);
  const [selectedSync, setSelectedSync] = useState<{
    name: string;
    label: string;
  } | null>(null);
  const [customSyncInterval, setCustomSyncInterval] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const queryClient = useQueryClient();

  const {
    data: connection,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["connection", params.connection_id],
    queryFn: () => getConnection(apiUrl, params.connection_id),
    refetchOnWindowFocus: false,
  });

  const { data: integration, isLoading: integrationLoading } = useQuery({
    queryKey: ["integration", connection?.integrationId],
    queryFn: () => getIntegration(apiUrl, connection!.integrationId),
    refetchOnWindowFocus: false,
    enabled: !!connection?.integrationId,
  });

  const { data: connector, isLoading: connectorLoading } = useQuery({
    queryKey: ["connector", integration?.connectorId],
    queryFn: () => getConnector(apiUrl, integration!.connectorId),
    refetchOnWindowFocus: false,
    enabled: !!integration?.connectorId,
  });

  const { data: availableSyncs, isLoading: syncsLoading } = useQuery({
    queryKey: ["available-syncs", params.connection_id],
    queryFn: () => getAvailableSyncs(apiUrl, params.connection_id),
    refetchOnWindowFocus: false,
    enabled: !!connection,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["connection-jobs", params.connection_id],
    queryFn: () => getConnectionJobs(apiUrl, params.connection_id),
    refetchOnWindowFocus: false,
    enabled: !!connection,
  });

  // Create a map of sync names to their jobs
  const syncJobsMap = useMemo(() => {
    if (!jobs) return new Map();
    return new Map(jobs.map((job) => [job.syncName, job]));
  }, [jobs]);

  const activateSyncMutation = useMutation({
    mutationFn: ({
      syncName,
      syncInterval,
    }: {
      syncName: string;
      syncInterval?: number;
    }) => activateSync(apiUrl, params.connection_id, syncName, syncInterval),
    onSuccess: (_, variables) => {
      toast.success("Sync Activated", {
        description: `${variables.syncName} has been activated successfully.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["available-syncs", params.connection_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connection", params.connection_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connection-jobs", params.connection_id],
      });
      router.refresh();
    },
    onError: (error: Error, variables) => {
      toast.error("Activation Failed", {
        description: `Failed to activate ${variables.syncName}: ${error.message}`,
      });
      router.refresh();
    },
  });

  const deactivateSyncMutation = useMutation({
    mutationFn: (syncName: string) =>
      deactivateSync(apiUrl, params.connection_id, syncName),
    onSuccess: (_, syncName) => {
      toast.success("Sync Deactivated", {
        description: `${syncName} has been deactivated successfully.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["available-syncs", params.connection_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connection", params.connection_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connection-jobs", params.connection_id],
      });
      router.refresh();
    },
    onError: (error: Error, syncName) => {
      toast.error("Deactivation Failed", {
        description: `Failed to deactivate ${syncName}: ${error.message}`,
      });
      router.refresh();
    },
  });

  const handleSyncToggle = (
    syncName: string,
    syncLabel: string,
    isActive: boolean
  ) => {
    if (isActive) {
      deactivateSyncMutation.mutate(syncName);
    } else {
      // Open dialog to set sync interval
      setSelectedSync({ name: syncName, label: syncLabel });
      setCustomSyncInterval(connection?.syncInterval?.toString() || "");
      setSyncIntervalDialogOpen(true);
    }
  };

  const handleActivateSync = () => {
    if (!selectedSync) return;

    const interval = customSyncInterval
      ? parseInt(customSyncInterval, 10)
      : undefined;

    if (customSyncInterval && (isNaN(interval!) || interval! <= 0)) {
      toast.error("Invalid Interval", {
        description: "Please enter a valid positive number for sync interval.",
      });
      return;
    }

    activateSyncMutation.mutate(
      {
        syncName: selectedSync.name,
        syncInterval: interval,
      },
      {
        onSuccess: () => {
          setSyncIntervalDialogOpen(false);
          setSelectedSync(null);
          setCustomSyncInterval("");
        },
      }
    );
  };

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

  if (!connection) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-2xl font-bold">Connection not found</h2>
        <p className="text-muted-foreground">
          The connection you're looking for doesn't exist.
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
      <div className="w-full flex justify-between items-center">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="h-8 px-2 text-muted-foreground !pl-0 hover:text-foreground hover:!bg-background cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => router.refresh()}
          variant="outline"
          size="icon"
          className="cursor-pointer"
          title="Refresh Connection"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {connectorLoading ? (
            <Skeleton className="w-16 h-16 rounded-lg" />
          ) : connector?.logo ? (
            <img
              src={connector.logo}
              alt={connector.name}
              className="w-16 h-16 rounded-lg object-contain bg-muted p-2 border"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {connection.id.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">
                Connection: {connection.id}
              </h1>
            </div>
            {integrationLoading ? (
              <Skeleton className="h-4 w-48 mt-1" />
            ) : integration ? (
              <p className="text-muted-foreground mt-1">{integration.name}</p>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6 bg-background"
      >
        <TabsList className="grid grid-cols-4 w-full bg-background border p-1 pl-0.5 pr-0.5 pt-0.5 rounded-none">
          <TabsTrigger
            value="general"
            className="flex items-center rounded-none"
          >
            <BracesIcon className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="metadata"
            className="flex items-center rounded-none"
          >
            <Braces className="mr-2 h-4 w-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="syncs" className="flex items-center rounded-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            Syncs
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="flex items-center rounded-none"
          >
            <Settings className="mr-2 h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Connection Information</CardTitle>
              <CardDescription>
                Basic information about this connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">External ID</label>
                  <p className="text-sm text-muted-foreground">
                    {connection.externalId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Connection ID</label>
                  <p className="text-sm text-muted-foreground">
                    {connection.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Default Sync Interval
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {connection.syncInterval} minutes
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Active Syncs</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {connection.activeSyncs &&
                  connection.activeSyncs.length > 0 ? (
                    connection.activeSyncs.map((sync) => (
                      <Badge key={sync} variant="secondary">
                        {sync}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active syncs
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div>
                  <label className="text-sm font-medium">Integration</label>
                  {integrationLoading ? (
                    <Skeleton className="h-8 w-full mt-2" />
                  ) : integration ? (
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-sm font-medium">
                          {integration.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {integration.id}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/integrations/${integration.id}`)
                        }
                        className="cursor-pointer"
                      >
                        View Integration
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      Not found
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Connector</label>
                  {connectorLoading ? (
                    <Skeleton className="h-8 w-full mt-2" />
                  ) : connector ? (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        {connector.logo && (
                          <img
                            src={connector.logo}
                            alt={connector.name}
                            className="w-8 h-8 rounded object-contain bg-muted p-1 border"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {connector.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {connector.id}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/connectors/${connector.id}`)
                        }
                        className="cursor-pointer"
                      >
                        View Connector
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      Not found
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syncs" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Available Syncs</CardTitle>
              <CardDescription>
                Activate or deactivate syncs for this connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncsLoading || jobsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : availableSyncs && availableSyncs.length > 0 ? (
                <div className="space-y-4">
                  {availableSyncs.map((sync) => {
                    const job = syncJobsMap.get(sync.name);

                    return (
                      <div
                        key={sync.id}
                        className="border rounded-md p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{sync.label}</p>
                              <Badge
                                variant={sync.isActive ? "default" : "outline"}
                              >
                                {sync.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {sync.description || "No description available"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {sync.id}
                            </p>
                          </div>
                          <Switch
                            checked={sync.isActive}
                            onCheckedChange={() =>
                              handleSyncToggle(
                                sync.name,
                                sync.label,
                                sync.isActive
                              )
                            }
                            disabled={
                              activateSyncMutation.isPending ||
                              deactivateSyncMutation.isPending
                            }
                          />
                        </div>

                        {/* Job Information */}
                        {sync.isActive && job && (
                          <div className="pt-3 border-t space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                Schedule Information
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm pl-6">
                              <div>
                                <span className="text-muted-foreground">
                                  Interval:
                                </span>{" "}
                                <span className="font-medium">
                                  {job.syncInterval} minute(s)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Job ID:
                                </span>{" "}
                                <span className="font-mono text-xs">
                                  {job.id}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Next Run:
                                </span>{" "}
                                {job.nextRun ? (
                                  <span className="font-medium">
                                    {new Date(job.nextRun).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Not scheduled
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Last Run:
                                </span>{" "}
                                {job.lastRun ? (
                                  <span className="font-medium">
                                    {new Date(job.lastRun).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Never
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No syncs available for this connection
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6">
          <Card className="bg-background rounded-sm">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Connection Metadata</CardDescription>
            </CardHeader>
            <CardContent>
              {connection.metadata ? (
                <pre className="p-4 bg-muted rounded-md overflow-auto">
                  {JSON.stringify(connection.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No metadata available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="rounded-sm bg-background">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Deleting this connection is permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteConnectionButton connectionId={connection.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Interval Dialog */}
      <Dialog
        open={syncIntervalDialogOpen}
        onOpenChange={setSyncIntervalDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Sync: {selectedSync?.label}</DialogTitle>
            <DialogDescription>
              Set a custom sync interval for this sync, or leave empty to use
              the connection's default interval ({connection.syncInterval}{" "}
              minutes).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
              <Input
                id="syncInterval"
                type="number"
                min="1"
                placeholder={`Default: ${connection.syncInterval} minutes`}
                value={customSyncInterval}
                onChange={(e) => setCustomSyncInterval(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default connection sync interval
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSyncIntervalDialogOpen(false);
                setSelectedSync(null);
                setCustomSyncInterval("");
              }}
              disabled={activateSyncMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivateSync}
              disabled={activateSyncMutation.isPending}
            >
              {activateSyncMutation.isPending ? "Activating..." : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
