"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { DataView } from "@/components/ui/data-view";
import { ColumnDef } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ConnectorMetadata,
  getConnections,
  getIntegrationsWithConnectors,
  PaginatedResponse,
} from "@databite/connect";
import { Connection, Integration } from "@databite/types";

// Extended type to include integration data
type ConnectionWithIntegration = Connection<any> & {
  integration?: {
    id: string;
    name: string;
    connector: {
      logo?: string;
      name: string;
    };
  };
};

export default function ConnectionsScreen() {
  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const router = useRouter();

  // Define columns for the data view
  const columns: ColumnDef<ConnectionWithIntegration>[] = [
    {
      accessorKey: "logo",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.integration?.connector.logo ? (
            <img
              src={row.original.integration.connector.logo}
              alt={row.original.integration.name}
              className="w-8 h-8 rounded-sm object-contain"
            />
          ) : (
            <span className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded-full text-white">
              {row.original.integration?.name?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "integration.name",
      header: "Integration Name",
      cell: ({ row }) => row.original.integration?.name || "N/A",
    },
    {
      accessorKey: "id",
      header: "Connection ID",
    },
    {
      accessorKey: "integrationId",
      header: "Integration ID",
    },
    {
      accessorKey: "syncInterval",
      header: "Sync Interval",
      cell: ({ row }) => row.original.syncInterval + " minute(s)",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="cursor-pointer"
          size="sm"
          onClick={() => router.push(`/connections/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const {
    data: connections,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedResponse<ConnectionWithIntegration>>({
    queryKey: ["connections", searchTerm, page, pageSize],
    queryFn: async () => {
      // Fetch connections with pagination metadata
      const connectionsResponse = await getConnections(apiUrl, {
        page,
        limit: pageSize,
      });

      // Fetch integrations to map to connections
      const integrations = await getIntegrationsWithConnectors(apiUrl);

      // Create a map of integrations by ID with proper typing
      const integrationMap = new Map<
        string,
        {
          connector: ConnectorMetadata;
          integration: Integration<any>;
        }
      >(
        integrations.map((integration) => [
          integration.integration.id,
          integration,
        ])
      );

      // Enhance connections with integration data
      const enhancedConnections = connectionsResponse.data.map(
        (conn: Connection<any>): ConnectionWithIntegration => {
          const integrationData = integrationMap.get(conn.integrationId);
          return {
            ...conn,
            integration: integrationData
              ? {
                  id: integrationData.integration.id,
                  name: integrationData.integration.name,
                  connector: {
                    logo: integrationData.connector.logo,
                    name: integrationData.connector.name,
                  },
                }
              : undefined,
          };
        }
      );

      // Return full paginated response with enhanced data
      return {
        data: enhancedConnections,
        pagination: connectionsResponse.pagination,
      };
    },
    initialData: {
      data: [],
      pagination: {
        page: 0,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
    refetchOnWindowFocus: false,
  });

  // Filter connections based on search term (client-side filtering on current page)
  const filteredConnections = useMemo(() => {
    if (!searchTerm.trim()) return connections.data;

    const lowerSearch = searchTerm.toLowerCase();
    return connections.data.filter((connection) => {
      return (
        connection.id?.toLowerCase().includes(lowerSearch) ||
        connection.integrationId?.toLowerCase().includes(lowerSearch) ||
        connection.integration?.name?.toLowerCase().includes(lowerSearch) ||
        connection.integration?.connector?.name
          ?.toLowerCase()
          .includes(lowerSearch) ||
        connection.syncInterval?.toString().toLowerCase().includes(lowerSearch)
      );
    });
  }, [connections, searchTerm]);

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

  return (
    <div className="w-full px-11 py-6 overflow-y-auto mt-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold font-mono tracking-tight">
            Connections
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your connections.
          </p>
        </div>
      </div>
      <Separator className="my-4" />

      <DataView
        data={filteredConnections}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        page={page}
        pageSize={pageSize}
        totalItems={connections.pagination.total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isFetching}
      />
    </div>
  );
}
