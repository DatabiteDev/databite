"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ConnectModal } from "@databite/connect";
import { Connection } from "@databite/types";
import {
  getIntegrationsWithConnectors,
  ConnectorMetadata,
} from "@databite/connect";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type IntegrationsWithConnector = {
  connector: ConnectorMetadata;
  integration: any;
};

const connectionFormSchema = z.object({
  integrationId: z
    .string()
    .min(1, { message: "Please select an integration." }),
  externalId: z.string().min(1, { message: "Please provide an external ID." }),
  syncInterval: z
    .number()
    .min(1, { message: "Sync interval must be at least 1 minute." })
    .int({ message: "Sync interval must be a whole number." }),
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

interface CreateConnectionFormProps {
  onConnectionCreated?: (connection: Connection<any>) => void;
}

export function CreateConnectionForm({
  onConnectionCreated,
}: CreateConnectionFormProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationsWithConnector[]>(
    []
  );
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationsWithConnector | null>(null);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [syncInterval, setSyncInterval] = useState(1);
  const [externalId, setExternalId] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      integrationId: "",
      syncInterval: 5,
    },
  });

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoadingIntegrations(true);
        const data = await getIntegrationsWithConnectors(apiUrl);
        setIntegrations(data);
      } catch (error) {
        toast.error("Failed to load integrations");
        console.error("Error fetching integrations:", error);
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    if (isDialogOpen) {
      fetchIntegrations();
    }
  }, [isDialogOpen, apiUrl]);

  const onSubmit = (data: ConnectionFormValues) => {
    const integration = integrations.find(
      (int) => int.integration.id === data.integrationId
    );

    if (!integration) return;

    setSelectedIntegration(integration);
    setSyncInterval(data.syncInterval);
    setExternalId(data.externalId);

    // 1️⃣ Close Radix Dialog first
    setIsDialogOpen(false);

    // 2️⃣ Open ConnectModal AFTER dialog cleanup
    setTimeout(() => {
      setIsConnectModalOpen(true);
    }, 0);
  };

  const handleAuthSuccess = (connection: Connection<any>) => {
    toast.success("Connection created successfully!");
    setIsConnectModalOpen(false);
    form.reset();

    router.push(`/connections/${connection.id}`);
    if (onConnectionCreated) {
      onConnectionCreated(connection);
    }
  };

  const handleAuthError = (error: Error) => {
    toast.error(`Connection failed: ${error.message}`);
    console.error("Authentication failed:", error);
  };

  const handleConnectModalClose = (open: boolean) => {
    setIsConnectModalOpen(open);

    if (!open) {
      // Delay cleanup so modal removes overlay/focus lock
      setTimeout(() => {
        setSelectedIntegration(null);
      }, 0);
    }
  };

  return (
    <>
      {/* ---- CREATE CONNECTION DIALOG ---- */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        modal={false} // 🔑 Prevent pointer lock conflicts
      >
        <DialogTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="mr-2" /> Create Connection
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Connection</DialogTitle>
            <DialogDescription>
              Select an integration to connect to your account.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 mt-4"
            >
              <FormField
                control={form.control}
                name="integrationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingIntegrations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an integration" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {isLoadingIntegrations ? (
                          <div className="flex justify-center py-2">
                            <Icons.spinner className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          integrations.map((integration) => (
                            <SelectItem
                              key={integration.integration.id}
                              value={integration.integration.id}
                            >
                              <div className="flex items-center gap-2">
                                {integration.connector.logo && (
                                  <img
                                    src={integration.connector.logo}
                                    className="w-4 h-4"
                                  />
                                )}
                                {integration.integration.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="syncInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sync Interval (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="externalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External ID</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoadingIntegrations}>
                Continue
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConnectModal
        open={isConnectModalOpen}
        onOpenChange={handleConnectModalClose}
        externalId={externalId}
        integrationId={selectedIntegration?.integration.id}
        baseUrl={apiUrl}
        syncInterval={syncInterval}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
    </>
  );
}
