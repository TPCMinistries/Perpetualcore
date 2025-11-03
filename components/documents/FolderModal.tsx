"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Folder as FolderType } from "@/types";

interface FolderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folder?: FolderType | null;
}

const FOLDER_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "gray", label: "Gray", class: "bg-gray-500" },
];

export function FolderModal({ open, onClose, onSuccess, folder }: FolderModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [parentFolderId, setParentFolderId] = useState<string>("root");
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (folder) {
        setName(folder.name);
        setDescription(folder.description || "");
        setColor(folder.color);
        setParentFolderId(folder.parent_folder_id || "root");
      } else {
        setName("");
        setDescription("");
        setColor("blue");
        setParentFolderId("root");
      }
      fetchFolders();
    }
  }, [open, folder]);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/documents/folders");
      if (response.ok) {
        const data = await response.json();
        // Exclude current folder and its children from parent options
        let availableFolders = data.folders || [];
        if (folder) {
          availableFolders = availableFolders.filter(
            (f: FolderType) => f.id !== folder.id && f.parent_folder_id !== folder.id
          );
        }
        setFolders(availableFolders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        parent_folder_id: parentFolderId && parentFolderId !== "root" ? parentFolderId : null,
        icon: "folder",
      };

      const url = folder
        ? `/api/documents/folders/${folder.id}`
        : "/api/documents/folders";

      const response = await fetch(url, {
        method: folder ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(folder ? "Folder updated successfully" : "Folder created successfully");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${folder ? "update" : "create"} folder`);
      }
    } catch (error) {
      console.error(`Error ${folder ? "updating" : "creating"} folder:`, error);
      toast.error(`Failed to ${folder ? "update" : "create"} folder`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create New Folder"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Folder Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Project Documents"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="parent">Parent Folder (Optional)</Label>
            <Select
              value={parentFolderId}
              onValueChange={setParentFolderId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (Root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">None (Root level)</SelectItem>
                {folders.filter(f => f.id && f.id.trim().length > 0).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLDER_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${c.class}`} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : folder ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
