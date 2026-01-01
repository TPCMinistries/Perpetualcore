"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  CellContext,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  Download,
  Filter,
  MoreHorizontal,
  Check,
  X,
  Copy,
  Clipboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SpreadsheetColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  minWidth?: number;
  type?: "text" | "number" | "select" | "date" | "boolean" | "tags";
  options?: { label: string; value: string }[];
  editable?: boolean;
  required?: boolean;
  format?: (value: any, row: T) => React.ReactNode;
  validate?: (value: any) => boolean | string;
}

export interface SpreadsheetViewProps<T extends { id: string }> {
  data: T[];
  columns: SpreadsheetColumn<T>[];
  onSave?: (row: T) => Promise<void>;
  onDelete?: (ids: string[]) => Promise<void>;
  onCreate?: () => void;
  onExport?: () => void;
  onBulkUpdate?: (ids: string[], updates: Partial<T>) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
  entityName?: string;
}

export function SpreadsheetView<T extends { id: string }>({
  data,
  columns: propColumns,
  onSave,
  onDelete,
  onCreate,
  onExport,
  onBulkUpdate,
  isLoading = false,
  className,
  emptyMessage = "No data",
  entityName = "item",
}: SpreadsheetViewProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<T>>>(new Map());

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Build table columns
  const columns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [
      // Selection column
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
        enableResizing: false,
      },
    ];

    // Add data columns
    for (const col of propColumns) {
      cols.push({
        id: String(col.key),
        accessorKey: col.key as string,
        header: ({ column }) => (
          <div
            className="flex items-center gap-1 cursor-pointer select-none"
            onClick={() => column.toggleSorting()}
          >
            <span>{col.header}</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </div>
        ),
        cell: (info: CellContext<T, unknown>) => (
          <EditableCell
            info={info}
            column={col}
            editingCell={editingCell}
            editValue={editValue}
            setEditingCell={setEditingCell}
            setEditValue={setEditValue}
            pendingChanges={pendingChanges}
            setPendingChanges={setPendingChanges}
            inputRef={inputRef}
          />
        ),
        size: col.width || 150,
        minSize: col.minWidth || 80,
        enableSorting: true,
      });
    }

    return cols;
  }, [propColumns, editingCell, editValue, pendingChanges]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const hasPendingChanges = pendingChanges.size > 0;

  // Save all pending changes
  const handleSaveAll = async () => {
    if (!onSave || pendingChanges.size === 0) return;

    try {
      for (const [rowId, changes] of pendingChanges.entries()) {
        const row = data.find((r) => r.id === rowId);
        if (row) {
          await onSave({ ...row, ...changes } as T);
        }
      }
      setPendingChanges(new Map());
      toast.success(`Saved ${pendingChanges.size} changes`);
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  // Delete selected rows
  const handleDeleteSelected = async () => {
    if (!onDelete || selectedCount === 0) return;

    const ids = Object.keys(rowSelection);
    try {
      await onDelete(ids);
      setRowSelection({});
      toast.success(`Deleted ${ids.length} ${entityName}(s)`);
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        if (e.key === "Escape") {
          setEditingCell(null);
          setEditValue(null);
        } else if (e.key === "Enter" && !e.shiftKey) {
          // Save and move to next row
          setEditingCell(null);
        } else if (e.key === "Tab") {
          e.preventDefault();
          // Move to next/prev cell
          // TODO: Implement cell navigation
        }
      }
    },
    [editingCell]
  );

  return (
    <div className={cn("flex flex-col h-full", className)} onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {onCreate && (
            <Button size="sm" onClick={onCreate} className="gap-1">
              <Plus className="h-4 w-4" />
              Add {entityName}
            </Button>
          )}

          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary">{selectedCount} selected</Badge>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {hasPendingChanges && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button size="sm" onClick={handleSaveAll} className="gap-1">
                  <Save className="h-4 w-4" />
                  Save {pendingChanges.size} changes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "h-10 px-3 text-left text-xs font-medium text-muted-foreground border-b border-r last:border-r-0",
                        "bg-muted/50"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="h-10 px-3 border-b border-r last:border-r-0">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const hasChanges = pendingChanges.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "group hover:bg-muted/30 transition-colors",
                        row.getIsSelected() && "bg-primary/5",
                        hasChanges && "bg-yellow-50 dark:bg-yellow-950/20"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={cn(
                            "h-10 px-3 border-b border-r last:border-r-0 text-sm",
                            "relative"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t text-xs text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} {entityName}(s)
        </span>
        {hasPendingChanges && (
          <span className="text-yellow-600 dark:text-yellow-400">
            {pendingChanges.size} unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}

// Editable Cell Component
function EditableCell<T extends { id: string }>({
  info,
  column,
  editingCell,
  editValue,
  setEditingCell,
  setEditValue,
  pendingChanges,
  setPendingChanges,
  inputRef,
}: {
  info: CellContext<T, unknown>;
  column: SpreadsheetColumn<T>;
  editingCell: { rowId: string; columnId: string } | null;
  editValue: any;
  setEditingCell: (cell: { rowId: string; columnId: string } | null) => void;
  setEditValue: (value: any) => void;
  pendingChanges: Map<string, Partial<T>>;
  setPendingChanges: (changes: Map<string, Partial<T>>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const value = info.getValue();
  const rowId = info.row.id;
  const columnId = String(column.key);
  const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === columnId;

  // Get pending value or current value
  const pendingRowChanges = pendingChanges.get(rowId);
  const displayValue = pendingRowChanges?.[columnId as keyof T] ?? value;

  const startEditing = () => {
    if (column.editable === false) return;
    setEditingCell({ rowId, columnId });
    setEditValue(displayValue);
  };

  const saveEdit = () => {
    if (editValue !== displayValue) {
      const newChanges = new Map(pendingChanges);
      const rowChanges = newChanges.get(rowId) || ({} as Partial<T>);
      (rowChanges as any)[columnId] = editValue;
      newChanges.set(rowId, rowChanges);
      setPendingChanges(newChanges);
    }
    setEditingCell(null);
    setEditValue(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue(null);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 -mx-2">
        {column.type === "select" ? (
          <Select value={editValue} onValueChange={(v) => { setEditValue(v); saveEdit(); }}>
            <SelectTrigger className="h-7 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : column.type === "boolean" ? (
          <Checkbox
            checked={editValue}
            onCheckedChange={(checked) => {
              setEditValue(checked);
              saveEdit();
            }}
          />
        ) : (
          <Input
            ref={inputRef}
            type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
            value={editValue ?? ""}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="h-7 text-sm"
          />
        )}
      </div>
    );
  }

  // Display value
  if (column.format) {
    return (
      <div className="cursor-pointer" onDoubleClick={startEditing}>
        {column.format(displayValue, info.row.original)}
      </div>
    );
  }

  if (column.type === "boolean") {
    return (
      <div className="cursor-pointer" onClick={startEditing}>
        {displayValue ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
      </div>
    );
  }

  if (column.type === "tags" && Array.isArray(displayValue)) {
    return (
      <div className="flex gap-1 flex-wrap cursor-pointer" onDoubleClick={startEditing}>
        {displayValue.slice(0, 3).map((tag: string, i: number) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {displayValue.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{displayValue.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "truncate cursor-pointer",
        column.editable !== false && "hover:bg-muted/50 rounded px-1 -mx-1"
      )}
      onDoubleClick={startEditing}
    >
      {displayValue ?? "—"}
    </div>
  );
}
