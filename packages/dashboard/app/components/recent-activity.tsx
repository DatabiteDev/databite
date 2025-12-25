"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorPage } from "@/components/react_query/query-error-page";
import { DataView } from "@/components/ui/data-view";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScheduledJobs, PaginatedResponse } from "@databite/connect";

type JobInfo = {
  id: string;
  connectionId: string;
  syncName: string;
  syncInterval: string;
  nextRun?: Date;
  lastRun?: Date;
};

const truncateWithEllipsis = (value: string, maxLength = 6) => {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
};

export default function RecentActivity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Define columns for the data view
  const columns: ColumnDef<JobInfo>[] = [
    {
      accessorKey: "id",
      header: "Job ID",
      cell: ({ row }) => {
        const value = row.getValue("id") as string;
        return (
          <div
            className="font-medium text-sm cursor-default"
            title={value} // shows full value on hover
          >
            {truncateWithEllipsis(value, 12)}
          </div>
        );
      },
    },
    {
      accessorKey: "connectionId",
      header: "Connection ID",
      cell: ({ row }) => {
        const value = row.getValue("connectionId") as string;
        return (
          <div
            className="font-medium text-sm cursor-default"
            title={value} // shows full value on hover
          >
            {truncateWithEllipsis(value, 12)}
          </div>
        );
      },
    },

    {
      accessorKey: "syncName",
      header: "Sync Name",
      cell: ({ row }) => (
        <div className="font-medium text-sm">{row.getValue("syncName")}</div>
      ),
    },
    {
      accessorKey: "syncInterval",
      header: "Sync Interval",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.getValue("syncInterval")} minute(s)
        </Badge>
      ),
    },
    {
      accessorKey: "nextRun",
      header: "Next Run",
      cell: ({ row }) => {
        const date = row.getValue("nextRun") as Date | undefined;
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleString() : "Not scheduled"}
          </div>
        );
      },
    },
    {
      accessorKey: "lastRun",
      header: "Last Run",
      cell: ({ row }) => {
        const date = row.getValue("lastRun") as Date | undefined;
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleString() : "Never"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Details",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer">
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Complete information about this scheduled job
            </DialogDescription>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Job ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {row.original.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Connection ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {row.original.connectionId}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Sync Name</label>
                <p className="text-sm text-muted-foreground">
                  {row.original.syncName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Sync Interval</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {row.original.syncInterval} minute(s)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Next Run</label>
                  <p className="text-sm text-muted-foreground">
                    {row.original.nextRun
                      ? new Date(row.original.nextRun).toLocaleString()
                      : "Not scheduled"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Run</label>
                  <p className="text-sm text-muted-foreground">
                    {row.original.lastRun
                      ? new Date(row.original.lastRun).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  // Fetch paginated jobs from the server
  const {
    data: jobs,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedResponse<JobInfo>>({
    queryKey: ["scheduled-jobs", page, pageSize],
    queryFn: () => getScheduledJobs(apiUrl, { page: page, limit: pageSize }),
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: false,
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
  });

  // Filter jobs based on search term (client-side filtering on current page)
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobs.data;

    const lowerSearch = searchTerm.toLowerCase();
    return jobs.data.filter((job) => {
      return (
        job.id.toLowerCase().includes(lowerSearch) ||
        job.connectionId.toLowerCase().includes(lowerSearch) ||
        job.syncName.toLowerCase().includes(lowerSearch) ||
        job.syncInterval.toLowerCase().includes(lowerSearch)
      );
    });
  }, [jobs, searchTerm]);

  // Show loading skeleton while fetching initial data
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
    <Card className="bg-background rounded-sm relative">
      <CardContent>
        <CardTitle>Scheduled Jobs</CardTitle>
        <CardDescription>
          View all scheduled sync jobs across your connections
        </CardDescription>
        <div>
          <DataView
            data={filteredJobs}
            columns={columns}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            page={page}
            pageSize={pageSize}
            totalItems={jobs.pagination.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isFetching}
            defaultView="table"
          />
        </div>
      </CardContent>
    </Card>
  );
}
