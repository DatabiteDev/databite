"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { DataView } from "@/components/ui/data-view";
import ConnectorCard from "./components/connector-card";
import { ColumnDef } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getConnectors } from "@databite/connect";
import { ConnectorMetadata } from "@databite/connect";

export default function ConnectorsScreen() {
  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const router = useRouter();

  // Define columns for the data view
  const columns: ColumnDef<ConnectorMetadata>[] = [
    {
      accessorKey: "logo",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.logo ? (
            <img
              src={row.original.logo}
              alt={row.original.name}
              className="w-8 h-8 rounded-sm object-contain"
            />
          ) : (
            <span className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded-full text-white">
              {row.original.name[0].toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "id",
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
          onClick={() => router.push(`/connectors/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const {
    data: connectors,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["connectors"],
    queryFn: () => getConnectors(apiUrl),
    initialData: [],
    refetchOnWindowFocus: false,
  });

  // Filter connectors based on search term
  const filteredConnectors = useMemo(() => {
    if (!searchTerm.trim()) return connectors;

    const lowerSearch = searchTerm.toLowerCase();
    return connectors.filter((connector) => {
      return (
        connector.id?.toLowerCase().includes(lowerSearch) ||
        connector.name?.toLowerCase().includes(lowerSearch) ||
        connector.description?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [connectors, searchTerm]);

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
            Connectors
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your connectors.
          </p>
        </div>
      </div>
      <Separator className="my-4" />

      <DataView
        data={filteredConnectors}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        page={page}
        pageSize={pageSize}
        totalItems={filteredConnectors.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isFetching}
        CardComponent={ConnectorCard}
        defaultView="list"
      />
    </div>
  );
}
