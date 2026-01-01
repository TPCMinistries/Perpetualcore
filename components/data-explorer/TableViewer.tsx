"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit2,
  Check,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface Column {
  name: string;
  displayName: string;
  type: string;
}

interface TableViewerProps {
  table: string;
  tableName: string;
}

export function TableViewer({ table, tableName }: TableViewerProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState("created_at");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: "query",
        table,
        limit: String(pageSize),
        offset: String(page * pageSize),
        orderBy,
        orderDir,
        ...(search && { search }),
      });

      const response = await fetch(`/api/data-explorer?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data || []);
      setColumns(result.columns || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [table, page, pageSize, orderBy, orderDir, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDir(orderDir === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(column);
      setOrderDir("desc");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/data-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", table }),
      });

      if (!response.ok) throw new Error("Export failed");

      const { data: exportData } = await response.json();

      // Convert to CSV
      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row: Record<string, any>) =>
          headers
            .map((h) => {
              const val = row[h];
              if (val === null || val === undefined) return "";
              if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} rows`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleCellEdit = async (rowId: string, column: string, value: any) => {
    try {
      const response = await fetch("/api/data-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          table,
          id: rowId,
          data: { [column]: value },
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      // Update local state
      setData((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [column]: value } : row))
      );

      setEditingCell(null);
      toast.success("Updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update");
    }
  };

  const formatCellValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (type === "datetime" && typeof value === "string") {
      return new Date(value).toLocaleString();
    }
    if (type === "json" || type === "array") {
      return JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? "..." : "");
    }
    if (type === "longtext") {
      return String(value).slice(0, 100) + (String(value).length > 100 ? "..." : "");
    }
    return String(value);
  };

  const copyToClipboard = (value: any) => {
    const text = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${tableName}...`}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total} rows
        </span>
        <span>
          Sorted by <Badge variant="secondary">{orderBy}</Badge>{" "}
          {orderDir === "asc" ? "ascending" : "descending"}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.name}
                    className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                    onClick={() => handleSort(col.name)}
                  >
                    <div className="flex items-center gap-2">
                      {col.displayName}
                      {orderBy === col.name && (
                        orderDir === "asc" ? (
                          <SortAsc className="h-3 w-3" />
                        ) : (
                          <SortDesc className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.length > 0
                      ? columns.map((col) => (
                          <TableCell key={col.name}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))
                      : Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {columns.map((col) => (
                      <TableCell
                        key={col.name}
                        className="max-w-[200px] truncate"
                        onDoubleClick={() => {
                          if (col.name !== "id" && col.name !== "user_id" && col.name !== "created_at") {
                            setEditingCell({ rowId: row.id, column: col.name });
                            setEditValue(row[col.name] ?? "");
                          }
                        }}
                      >
                        {editingCell?.rowId === row.id && editingCell?.column === col.name ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCellEdit(row.id, col.name, editValue);
                                } else if (e.key === "Escape") {
                                  setEditingCell(null);
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleCellEdit(row.id, col.name, editValue)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setEditingCell(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span title={String(row[col.name] ?? "")}>
                            {formatCellValue(row[col.name], col.type)}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRow(row)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(row)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy as JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row Detail Dialog */}
      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Row Details</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-4">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <div className="font-medium text-muted-foreground">{key}</div>
                  <div className="col-span-2 break-all">
                    {typeof value === "object" ? (
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : value === null || value === undefined ? (
                      <span className="text-muted-foreground">null</span>
                    ) : typeof value === "boolean" ? (
                      <Badge variant={value ? "default" : "secondary"}>
                        {value ? "true" : "false"}
                      </Badge>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedRow)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy as JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
