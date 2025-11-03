"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, User, Tag, FolderOpen, MapPin, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface SearchFilters {
  types?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  priority?: string;
  authors?: string[];
  tags?: string[];
  categories?: string[];
  location?: string;
  hasAttachments?: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: AdvancedSearchFiltersProps) {
  const [authorInput, setAuthorInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    onFiltersChange({ ...filters, types: newTypes.length > 0 ? newTypes : undefined });
  };

  const addAuthor = () => {
    if (!authorInput.trim()) return;
    const currentAuthors = filters.authors || [];
    if (!currentAuthors.includes(authorInput.trim())) {
      onFiltersChange({
        ...filters,
        authors: [...currentAuthors, authorInput.trim()],
      });
    }
    setAuthorInput("");
  };

  const removeAuthor = (author: string) => {
    const newAuthors = (filters.authors || []).filter((a) => a !== author);
    onFiltersChange({
      ...filters,
      authors: newAuthors.length > 0 ? newAuthors : undefined,
    });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      onFiltersChange({
        ...filters,
        tags: [...currentTags, tagInput.trim()],
      });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const newTags = (filters.tags || []).filter((t) => t !== tag);
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const addCategory = () => {
    if (!categoryInput.trim()) return;
    const currentCategories = filters.categories || [];
    if (!currentCategories.includes(categoryInput.trim())) {
      onFiltersChange({
        ...filters,
        categories: [...currentCategories, categoryInput.trim()],
      });
    }
    setCategoryInput("");
  };

  const removeCategory = (category: string) => {
    const newCategories = (filters.categories || []).filter((c) => c !== category);
    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const hasActiveFilters = () => {
    return (
      (filters.types && filters.types.length > 0) ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.status ||
      filters.priority ||
      (filters.authors && filters.authors.length > 0) ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.categories && filters.categories.length > 0) ||
      filters.location ||
      filters.hasAttachments
    );
  };

  const typeOptions = [
    { value: "conversation", label: "Conversations" },
    { value: "document", label: "Documents" },
    { value: "task", label: "Tasks" },
    { value: "calendar", label: "Calendar" },
    { value: "email", label: "Email" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          {hasActiveFilters() && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Content Types */}
          <div>
            <Label className="mb-2 block">Content Types</Label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((type) => (
                <Badge
                  key={type.value}
                  variant={filters.types?.includes(type.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTypeToggle(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="mb-2 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateFrom: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="mb-2 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateTo: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="mb-2 block">
                Status
              </Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    status: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority" className="mb-2 block">
                Priority
              </Label>
              <Select
                value={filters.priority || ""}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    priority: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Authors */}
          <div>
            <Label className="mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              Authors
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add author name..."
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAuthor())}
              />
              <Button type="button" onClick={addAuthor} size="sm">
                Add
              </Button>
            </div>
            {filters.authors && filters.authors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.authors.map((author) => (
                  <Badge key={author} variant="secondary">
                    {author}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeAuthor(author)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <Label className="mb-2 flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              Categories
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add category..."
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              />
              <Button type="button" onClick={addCategory} size="sm">
                Add
              </Button>
            </div>
            {filters.categories && filters.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Enter location..."
              value={filters.location || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  location: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* Has Attachments */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasAttachments"
              className="h-4 w-4 rounded border-gray-300"
              checked={filters.hasAttachments || false}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  hasAttachments: e.target.checked || undefined,
                })
              }
            />
            <Label htmlFor="hasAttachments" className="flex items-center gap-1 cursor-pointer">
              <Paperclip className="h-3 w-3" />
              Has Attachments
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
