"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, Plus, Briefcase, FolderIcon, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AssignmentType = "projects" | "folders" | "spaces";

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Folder {
  id: string;
  name: string;
  color?: string;
}

interface KnowledgeSpace {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface MultiAssignmentSelectorProps {
  documentId: string;
  type: AssignmentType;
  selectedItems: Array<Project | Folder | KnowledgeSpace>;
  onItemsChange: () => void;
  className?: string;
}

export function MultiAssignmentSelector({
  documentId,
  type,
  selectedItems,
  onItemsChange,
  className,
}: MultiAssignmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [allItems, setAllItems] = useState<Array<Project | Folder | KnowledgeSpace>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllItems();
  }, [type]);

  async function fetchAllItems() {
    try {
      let endpoint = "";
      if (type === "projects") endpoint = "/api/projects";
      else if (type === "folders") endpoint = "/api/documents/folders";
      else if (type === "spaces") endpoint = "/api/spaces";

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();

      if (type === "projects") {
        setAllItems(data || []);
      } else if (type === "folders") {
        setAllItems(data.folders || []);
      } else if (type === "spaces") {
        setAllItems(data.spaces || []);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  }

  async function handleAddItem(itemId: string) {
    setLoading(true);
    try {
      const endpoint = `/api/documents/${documentId}/${type}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [`${type.slice(0, -1)}_id`]: itemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to add ${type.slice(0, -1)}`);
      }

      toast.success(`${type === "projects" ? "Project" : type === "folders" ? "Folder" : "Space"} added`);
      onItemsChange();
    } catch (error: any) {
      console.error(`Error adding ${type.slice(0, -1)}:`, error);
      toast.error(error.message || `Failed to add ${type.slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    setLoading(true);
    try {
      const endpoint = `/api/documents/${documentId}/${type}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [`${type.slice(0, -1)}_id`]: itemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to remove ${type.slice(0, -1)}`);
      }

      toast.success(`${type === "projects" ? "Project" : type === "folders" ? "Folder" : "Space"} removed`);
      onItemsChange();
    } catch (error: any) {
      console.error(`Error removing ${type.slice(0, -1)}:`, error);
      toast.error(error.message || `Failed to remove ${type.slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  }

  function getIcon() {
    if (type === "projects") return Briefcase;
    if (type === "folders") return FolderIcon;
    return Building2;
  }

  function getItemDisplay(item: any) {
    if (type === "projects") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      );
    } else if (type === "spaces") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg">{item.emoji}</span>
          <span>{item.name}</span>
        </div>
      );
    } else {
      return <span>{item.name}</span>;
    }
  }

  const Icon = getIcon();
  const selectedIds = selectedItems.map((item) => item.id);
  const availableItems = allItems.filter((item) => !selectedIds.includes(item.id));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {selectedItems.map((item) => (
        <Badge
          key={item.id}
          variant="outline"
          className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 pl-2 pr-1 py-1 flex items-center gap-1.5"
        >
          {getItemDisplay(item)}
          <button
            onClick={() => handleRemoveItem(item.id)}
            disabled={loading}
            className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5 transition-colors"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {availableItems.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-dashed hover:border-slate-400 dark:hover:border-slate-500"
            >
              <Plus className="h-3 w-3 mr-1" />
              <Icon className="h-3 w-3 mr-1" />
              Add {type === "projects" ? "Project" : type === "folders" ? "Folder" : "Space"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${type}...`} />
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {availableItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      handleAddItem(item.id);
                      setOpen(false);
                    }}
                  >
                    {getItemDisplay(item)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
