"use client";

import { useState, useEffect } from "react";
import { Folder, Plus, MoreVertical, FolderOpen, Trash2, Edit2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Folder as FolderType } from "@/types";

interface FolderSidebarProps {
  selectedFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onRefresh?: () => void;
}

export function FolderSidebar({
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onRefresh,
}: FolderSidebarProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/documents/folders");
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this folder? Documents will be moved to the parent folder.")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Folder deleted successfully");
        fetchFolders();
        onRefresh?.();
        if (selectedFolderId === folderId) {
          onFolderSelect(null);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    }
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Build folder tree
  const rootFolders = folders.filter((f) => !f.parent_folder_id);
  const getFolderChildren = (parentId: string) => {
    return folders.filter((f) => f.parent_folder_id === parentId);
  };

  const renderFolder = (folder: FolderType, level = 0) => {
    const children = getFolderChildren(folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    const getFolderColor = (color: string) => {
      const colors: Record<string, string> = {
        blue: "text-blue-600",
        green: "text-green-600",
        red: "text-red-600",
        yellow: "text-yellow-600",
        purple: "text-purple-600",
        pink: "text-pink-600",
        orange: "text-orange-600",
      };
      return colors[color] || "text-blue-600";
    };

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
            isSelected ? "bg-accent" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => toggleFolder(folder.id, e)}
              className="p-0.5 hover:bg-accent-foreground/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          {isSelected ? (
            <FolderOpen className={`h-4 w-4 ${getFolderColor(folder.color)}`} />
          ) : (
            <Folder className={`h-4 w-4 ${getFolderColor(folder.color)}`} />
          )}
          <span className="flex-1 text-sm truncate">{folder.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFolder(folder);
                }}
              >
                <Edit2 className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleDeleteFolder(folder.id, e)}
                className="text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderFolder(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onCreateFolder}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {/* All Documents */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
            selectedFolderId === null ? "bg-accent" : ""
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="h-4 w-4 text-gray-600" />
          <span className="text-sm">All Documents</span>
        </div>

        {/* Folder Tree */}
        <div className="pt-2">
          {rootFolders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No folders yet</p>
              <button
                onClick={onCreateFolder}
                className="text-primary hover:underline mt-1"
              >
                Create your first folder
              </button>
            </div>
          ) : (
            rootFolders.map((folder) => renderFolder(folder))
          )}
        </div>
      </div>
    </div>
  );
}
