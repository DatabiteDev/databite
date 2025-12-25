"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, List, Table } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "../ui/search-bar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

// Simple empty state placeholder component
function ListEmptyPlaceholder({
  title = "No results",
  subtitle = "No items found.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] border rounded-md p-8 text-center">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

// Skeleton components
function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-md border">
      <TableComponent>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
    </div>
  );
}

function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 gap-5 pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-lg" />
      ))}
    </div>
  );
}

interface DataViewProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];

  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  filterPlaceholder?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  CardComponent?: React.ComponentType<{ item: TData; className?: string }>;
  cardClassName?: string;
  defaultView?: "table" | "list";
  listGridCols?: string;

  isLoading?: boolean;
}

export function DataView<TData, TValue>({
  data,
  columns,

  searchTerm,
  onSearchChange,

  page = 0,
  pageSize = 10,
  totalItems = data.length,
  onPageChange,
  onPageSizeChange,

  filterPlaceholder = "Filter...",
  emptyTitle = "No results",
  emptySubtitle = "No items found.",
  CardComponent,
  cardClassName = "w-full",
  defaultView = "table",
  listGridCols = "grid-cols-4 max-sm:grid-cols-1",

  isLoading = false,
}: DataViewProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const pageCount = Math.ceil(totalItems / pageSize);
  const canPreviousPage = page > 0;
  const canNextPage = page < pageCount - 1;

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount || 1,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: !!onPageChange,
    state: {
      sorting,
      pagination: {
        pageIndex: page,
        pageSize,
      },
      columnVisibility,
      rowSelection,
    },
  });

  const debouncedSearch = React.useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    },
    [onSearchChange]
  );

  return (
    <div className="w-full h-[400px]">
      <Tabs defaultValue={defaultView}>
        <div className="flex items-center justify-between py-4">
          {onSearchChange && (
            <SearchBar
              onSearch={debouncedSearch}
              placeholder={filterPlaceholder}
            />
          )}
          <div className="flex space-x-2 ml-auto">
            {CardComponent && (
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          {isLoading ? (
            <TableSkeleton columns={columns.length} rows={5} />
          ) : data.length === 0 ? (
            <ListEmptyPlaceholder title={emptyTitle} subtitle={emptySubtitle} />
          ) : (
            <>
              <div className="rounded-md border">
                <TableComponent>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </TableComponent>
              </div>
              {onPageChange && pageCount > 1 && (
                <div className="flex items-center justify-center py-4">
                  <PaginationControls
                    currentPage={page}
                    pageCount={pageCount}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {CardComponent && (
          <TabsContent value="list" className="mt-0">
            {isLoading ? (
              <CardSkeleton count={8} />
            ) : data.length === 0 ? (
              <ListEmptyPlaceholder
                title={emptyTitle}
                subtitle={emptySubtitle}
              />
            ) : (
              <>
                <div className={`grid ${listGridCols} gap-5 pb-4`}>
                  {data.map((item, index) => (
                    <CardComponent
                      key={index}
                      item={item}
                      className={cardClassName}
                    />
                  ))}
                </div>
                {onPageChange && pageCount > 1 && (
                  <div className="flex items-center justify-end py-4">
                    <PaginationControls
                      currentPage={page}
                      pageCount={pageCount}
                      onPageChange={onPageChange}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  pageCount,
  onPageChange,
}: PaginationControlsProps) {
  if (!pageCount || pageCount <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (pageCount <= maxPagesToShow) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
      return pages;
    }

    pages.push(0);

    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(pageCount - 2, currentPage + 1);

    if (startPage > 1) pages.push(-1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < pageCount - 2) pages.push(-2);

    pages.push(pageCount - 1);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 0) onPageChange(currentPage - 1);
            }}
            className={
              currentPage === 0 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={index}>
            {pageNumber === -1 || pageNumber === -2 ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(pageNumber);
                }}
                isActive={pageNumber === currentPage}
              >
                {pageNumber + 1}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < pageCount - 1) onPageChange(currentPage + 1);
            }}
            className={
              currentPage >= pageCount - 1
                ? "pointer-events-none opacity-50"
                : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
