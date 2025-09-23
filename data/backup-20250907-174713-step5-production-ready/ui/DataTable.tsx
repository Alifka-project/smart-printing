"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export default function DataTable<T>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  emptyMessage = "No data available",
  loading = false,
  className = ""
}: DataTableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  if (loading) {
    return (
      <div className={cn("bg-surface border border-border rounded-2xl overflow-hidden", className)}>
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("bg-surface border border-border rounded-2xl overflow-hidden", className)}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data found</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-surface border border-border rounded-2xl overflow-hidden shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold text-foreground",
                    "first:rounded-tl-2xl last:rounded-tr-2xl",
                    column.sortable && "cursor-pointer hover:bg-muted/70 transition-colors duration-200",
                    column.width && column.width
                  )}
                  style={{
                    width: column.width || 'auto',
                    minWidth: column.width || 'auto',
                    maxWidth: column.width || 'auto'
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  scope="col"
                >
                  <div className="flex items-center space-x-2">
                    <span className="truncate">{column.header}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b border-border/50 transition-colors duration-200",
                  "hover:bg-muted/30",
                  onRowClick && "cursor-pointer",
                  index % 2 === 0 ? "bg-surface" : "bg-muted/20"
                )}
                onClick={() => onRowClick?.(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
                role={onRowClick ? "button" : undefined}
                aria-label={onRowClick ? `Click to view details for row ${index + 1}` : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-foreground"
                    style={{
                      width: column.width || 'auto',
                      minWidth: column.width || 'auto',
                      maxWidth: column.width || 'auto'
                    }}
                  >
                    <div className="truncate">
                      {column.accessor(item)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
