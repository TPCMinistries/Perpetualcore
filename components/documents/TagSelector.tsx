"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Tag } from "@/types";

interface TagSelectorProps {
  documentId: string;
  selectedTags: Tag[];
  onTagsChange: () => void;
}

export function TagSelector({ documentId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAllTags();
    }
  }, [open]);

  const fetchAllTags = async () => {
    try {
      const response = await fetch("/api/documents/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/documents/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: "gray" }),
      });

      if (response.ok) {
        const { tag } = await response.json();
        toast.success("Tag created");
        setAllTags([...allTags, tag]);
        setNewTagName("");
        // Immediately add the new tag to the document
        await handleAddTag(tag.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      });

      if (response.ok) {
        toast.success("Tag added");
        onTagsChange();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add tag");
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const response = await fetch(`/api/documents/${documentId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tag removed");
        onTagsChange();
      } else {
        toast.error("Failed to remove tag");
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const selectedTagIds = new Set(selectedTags.map((t) => t.id));
  const availableTags = allTags.filter(
    (tag) =>
      !selectedTagIds.has(tag.id) &&
      (filter === "" || tag.name.toLowerCase().includes(filter.toLowerCase()))
  );

  const getTagColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      green: "bg-green-100 text-green-800 border-green-300",
      red: "bg-red-100 text-red-800 border-red-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      pink: "bg-pink-100 text-pink-800 border-pink-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className={`${getTagColor(tag.color)} text-xs`}
        >
          <TagIcon className="h-3 w-3 mr-1" />
          {tag.name}
          <button
            onClick={(e) => handleRemoveTag(tag.id, e)}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div>
              <Input
                placeholder="Search or create tag..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Available tags */}
            <div className="max-h-48 overflow-auto space-y-1">
              {availableTags.length === 0 && filter === "" && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No tags available
                </p>
              )}
              {availableTags.length === 0 && filter !== "" && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">No matching tags</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewTagName(filter);
                      setFilter("");
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create "{filter}"
                  </Button>
                </div>
              )}
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag.id)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${getTagColor(tag.color)}`} />
                  {tag.name}
                </button>
              ))}
            </div>

            {/* Create new tag */}
            {(filter !== "" || newTagName !== "") && (
              <div className="pt-2 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="New tag name"
                    value={newTagName || filter}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={loading || (!newTagName.trim() && !filter.trim())}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
