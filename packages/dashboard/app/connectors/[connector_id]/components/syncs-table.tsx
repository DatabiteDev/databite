import { ColumnDef } from "@tanstack/react-table";
import { DataView } from "@/components/ui/data-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { ConnectorMetadata, SyncMetadata } from "@databite/connect";

export const columns: ColumnDef<SyncMetadata>[] = [
  {
    header: "Name",
    accessorKey: "label",
  },
  {
    header: "ID",
    accessorKey: "id",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Max Retries",
    accessorKey: "maxRetries",
  },
  {
    header: "Timeout",
    accessorKey: "timeout",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="cursor-pointer">
            View Schema
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[450px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schema</DialogTitle>
          </DialogHeader>
          <DialogDescription>Output Schema</DialogDescription>
          <pre className="p-4 bg-muted rounded-md overflow-auto">
            {JSON.stringify(row.original.outputSchema, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    ),
  },
];

export default function SyncsTable({
  connector,
}: {
  connector: ConnectorMetadata;
}) {
  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const filteredSyncs = useMemo(() => {
    if (!searchTerm.trim()) {
      return Object.values(connector.syncs);
    }
    return Object.values(connector.syncs).filter((sync) =>
      sync.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, Object.values(connector.syncs)]);

  return (
    <DataView
      data={filteredSyncs}
      columns={columns}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      page={page}
      pageSize={pageSize}
      totalItems={filteredSyncs.length}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  );
}
