"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Star,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  ExternalLink,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Contact,
  RelationshipStrength,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";
import { useContactsPage } from "../ContactsPageProvider";
import { useUpdateContact, useToggleFavorite } from "@/lib/contacts/use-contacts";
import { formatDistanceToNow } from "date-fns";

interface ContactsTableViewProps {
  contacts: Contact[];
  isLoading?: boolean;
  onRowClick?: (contact: Contact) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Avatar gradient colors based on name
const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

function getAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

// Contact type colors
const TYPE_COLORS: Record<string, string> = {
  investor: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  partner: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  customer: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  vendor: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  mentor: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  advisor: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  team: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  prospect: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  lead: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  contact: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
};

export function ContactsTableView({
  contacts,
  isLoading = false,
  onRowClick,
}: ContactsTableViewProps) {
  const router = useRouter();
  const {
    state,
    selectContact,
    selectAll,
    clearSelection,
    toggleSelection,
    startEditing,
    stopEditing,
  } = useContactsPage();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [editValue, setEditValue] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateContact = useUpdateContact();
  const toggleFavorite = useToggleFavorite();

  // Convert Set to object for react-table
  const rowSelection = useMemo(() => {
    const selection: RowSelectionState = {};
    state.selectedIds.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [state.selectedIds]);

  // Focus input when editing starts
  useEffect(() => {
    if (state.editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [state.editingCell]);

  const handleRowSelectionChange = useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      const ids = Object.keys(newSelection).filter((id) => newSelection[id]);
      if (ids.length === 0) {
        clearSelection();
      } else {
        selectAll(ids);
      }
    },
    [rowSelection, clearSelection, selectAll]
  );

  const handleSaveEdit = useCallback(
    async (contactId: string, field: string, value: any) => {
      try {
        await updateContact.mutateAsync({
          id: contactId,
          data: { [field]: value },
        });
      } catch (error) {
        // Error handled by mutation
      }
      stopEditing();
      setEditValue(null);
    },
    [updateContact, stopEditing]
  );

  // Column definitions
  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
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
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
      },
      // Name column with avatar
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <SortableHeader column={column} label="Name" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const gradient = getAvatarGradient(contact.full_name);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
                  <AvatarImage src={contact.avatar_url || ""} />
                  <AvatarFallback className={cn("text-xs font-medium text-white bg-gradient-to-br", gradient)}>
                    {getInitials(contact.full_name)}
                  </AvatarFallback>
                </Avatar>
                {contact.is_favorite && (
                  <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-white text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">
                  {contact.full_name}
                </span>
                {contact.job_title && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {contact.job_title}
                  </p>
                )}
              </div>
            </div>
          );
        },
        size: 280,
      },
      // Company
      {
        accessorKey: "company",
        header: ({ column }) => (
          <SortableHeader column={column} label="Company" />
        ),
        cell: ({ row, column }) => {
          const contact = row.original;
          const isEditing =
            state.editingCell?.rowId === contact.id &&
            state.editingCell?.columnId === "company";

          if (isEditing) {
            return (
              <Input
                ref={inputRef}
                value={editValue ?? contact.company ?? ""}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveEdit(contact.id, "company", editValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(contact.id, "company", editValue);
                  if (e.key === "Escape") {
                    stopEditing();
                    setEditValue(null);
                  }
                }}
                className="h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            );
          }

          return (
            <div
              className="truncate cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing(contact.id, "company");
                setEditValue(contact.company || "");
              }}
            >
              {contact.company || "—"}
            </div>
          );
        },
        size: 160,
      },
      // Contact Type
      {
        accessorKey: "contact_type",
        header: ({ column }) => (
          <SortableHeader column={column} label="Type" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const type = contact.contact_type || "contact";
          const colorClass = TYPE_COLORS[type] || TYPE_COLORS.contact;
          return (
            <Badge variant="outline" className={cn("text-xs capitalize font-medium border", colorClass)}>
              {type}
            </Badge>
          );
        },
        size: 100,
      },
      // Email
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column} label="Email" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const isEditing =
            state.editingCell?.rowId === contact.id &&
            state.editingCell?.columnId === "email";

          if (isEditing) {
            return (
              <Input
                ref={inputRef}
                type="email"
                value={editValue ?? contact.email ?? ""}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveEdit(contact.id, "email", editValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(contact.id, "email", editValue);
                  if (e.key === "Escape") {
                    stopEditing();
                    setEditValue(null);
                  }
                }}
                className="h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            );
          }

          return (
            <div
              className="truncate cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 text-sm"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing(contact.id, "email");
                setEditValue(contact.email || "");
              }}
            >
              {contact.email || "—"}
            </div>
          );
        },
        size: 200,
      },
      // Phone
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="truncate text-sm text-muted-foreground">
              {contact.phone || "—"}
            </div>
          );
        },
        size: 140,
        enableSorting: false,
      },
      // Relationship Strength
      {
        accessorKey: "relationship_strength",
        header: ({ column }) => (
          <SortableHeader column={column} label="Relationship" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const strength = contact.relationship_strength as RelationshipStrength;
          const config = RELATIONSHIP_STRENGTH_CONFIG[strength];

          if (!config) {
            return (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1.5 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
                <span className="text-xs text-slate-400">—</span>
              </div>
            );
          }

          // Get strength level for bars
          const strengthLevels: Record<string, number> = {
            inner_circle: 5,
            close: 4,
            connected: 3,
            acquaintance: 2,
            new: 1,
          };
          const level = strengthLevels[strength] || 0;
          const barColors: Record<string, string> = {
            inner_circle: "bg-violet-500",
            close: "bg-emerald-500",
            connected: "bg-blue-500",
            acquaintance: "bg-amber-500",
            new: "bg-slate-400",
          };

          return (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-4 rounded-full transition-all",
                      i < level
                        ? barColors[strength]
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
            </div>
          );
        },
        size: 150,
      },
      // Last Contacted
      {
        accessorKey: "last_interaction_at",
        header: ({ column }) => (
          <SortableHeader column={column} label="Last Contact" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          if (!contact.last_interaction_at) {
            return <span className="text-muted-foreground text-sm">Never</span>;
          }
          return (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(contact.last_interaction_at), {
                addSuffix: true,
              })}
            </span>
          );
        },
        size: 120,
      },
      // Tags
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const contact = row.original;
          const tags = contact.tags || [];

          if (tags.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        size: 180,
        enableSorting: false,
      },
      // Actions
      {
        id: "actions",
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {contact.email && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${contact.email}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                )}
                {contact.phone && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${contact.phone}`;
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </DropdownMenuItem>
                )}
                {contact.linkedin_url && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(contact.linkedin_url, "_blank");
                    }}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite.mutate({
                      id: contact.id,
                      isFavorite: !contact.is_favorite,
                    });
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 mr-2",
                      contact.is_favorite && "fill-yellow-400 text-yellow-400"
                    )}
                  />
                  {contact.is_favorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/contacts/${contact.id}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 40,
        enableSorting: false,
      },
    ],
    [
      state.editingCell,
      editValue,
      startEditing,
      stopEditing,
      handleSaveEdit,
      toggleFavorite,
      router,
    ]
  );

  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const handleRowClick = useCallback(
    (contact: Contact, event: React.MouseEvent) => {
      // If clicking on checkbox or action button, don't navigate
      if ((event.target as HTMLElement).closest('button, [role="checkbox"]')) {
        return;
      }

      const allIds = contacts.map((c) => c.id);

      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        selectContact(contact.id, event.shiftKey, event.metaKey || event.ctrlKey, allIds);
      } else if (onRowClick) {
        onRowClick(contact);
      } else {
        router.push(`/dashboard/contacts/${contact.id}`);
      }
    },
    [contacts, selectContact, onRowClick, router]
  );

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "h-11 px-4 text-left text-xs font-semibold uppercase tracking-wider",
                        "text-slate-500 dark:text-slate-400",
                        "bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm",
                        "border-b border-slate-200 dark:border-slate-700"
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="bg-white dark:bg-slate-900/30">
                    {columns.map((_, j) => (
                      <td key={j} className="h-14 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-slate-500 dark:text-slate-400">
                    No contacts found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => {
                  const isSelected = row.getIsSelected();
                  const isFocused = state.focusedIndex === row.index;

                  return (
                    <tr
                      key={row.id}
                      onClick={(e) => handleRowClick(row.original, e)}
                      className={cn(
                        "group cursor-pointer transition-all duration-150",
                        "hover:bg-violet-50/50 dark:hover:bg-violet-900/10",
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900/30"
                          : "bg-slate-50/30 dark:bg-slate-800/20",
                        isSelected && "!bg-violet-100/70 dark:!bg-violet-900/30",
                        isFocused && "ring-2 ring-inset ring-violet-500"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="h-14 px-4 text-sm"
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
    </div>
  );
}

// Sortable header component
function SortableHeader({
  column,
  label,
}: {
  column: any;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1 cursor-pointer select-none"
      onClick={() => column.toggleSorting()}
    >
      <span>{label}</span>
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </div>
  );
}
