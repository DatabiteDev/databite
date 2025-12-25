"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { DataView } from "@/components/ui/data-view";
import IntegrationCard from "./components/integration-card";
import { ColumnDef } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getIntegrationsWithConnectors } from "@databite/connect";

export default function IntegrationsScreen() {
  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const router = useRouter();

  // Define columns for the data view
  const columns: ColumnDef<
    Awaited<ReturnType<typeof getIntegrationsWithConnectors>>[number]
  >[] = [
    {
      accessorKey: "logo",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.connector.logo ? (
            <img
              src={row.original.connector.logo}
              alt={row.original.integration.name}
              className="w-8 h-8 rounded-sm object-contain"
            />
          ) : (
            <span className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded-full text-white">
              {row.original.integration.name[0].toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "integration.name",
      header: "Name",
    },
    {
      accessorKey: "integration.id",
      header: "ID",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="cursor-pointer"
          size="sm"
          onClick={() =>
            router.push(`/integrations/${row.original.integration.id}`)
          }
        >
          View
        </Button>
      ),
    },
  ];

  const {
    data: integrations,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => getIntegrationsWithConnectors(apiUrl),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  // Filter integrations based on search term
  const filteredIntegrations = useMemo(() => {
    if (!searchTerm.trim()) return integrations;

    const lowerSearch = searchTerm.toLowerCase();
    return integrations.filter((integration) => {
      return (
        integration.integration.id?.toLowerCase().includes(lowerSearch) ||
        integration.integration.name?.toLowerCase().includes(lowerSearch) ||
        integration.connector.id?.toLowerCase().includes(lowerSearch) ||
        integration.connector.name?.toLowerCase().includes(lowerSearch) ||
        integration.connector.description?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [integrations, searchTerm]);

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
            Integrations
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your integrations.
          </p>
        </div>
      </div>
      <Separator className="my-4" />

      <DataView
        data={filteredIntegrations}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        page={page}
        pageSize={pageSize}
        totalItems={filteredIntegrations.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isFetching}
        CardComponent={IntegrationCard}
        defaultView="list"
      />
    </div>
  );
}
