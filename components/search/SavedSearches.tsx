"use client";

import { useState, useEffect } from "react";
import {
  Bookmark,
  Star,
  Trash2,
  Play,
  Edit,
  Share2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SearchFilters } from "./AdvancedSearchFilters";

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: SearchFilters;
  is_pinned: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
}

interface SavedSearchesProps {
  onLoadSearch: (query: string, filters: SearchFilters) => void;
  currentQuery: string;
  currentFilters: SearchFilters;
}

export function SavedSearches({
  onLoadSearch,
  currentQuery,
  currentFilters,
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveShared, setSaveShared] = useState(false);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch("/api/search/saved");
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.savedSearches || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }

    if (!currentQuery.trim()) {
      toast.error("Cannot save an empty search");
      return;
    }

    try {
      const response = await fetch("/api/search/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName,
          description: saveDescription,
          query: currentQuery,
          filters: currentFilters,
          is_shared: saveShared,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedSearches([data.savedSearch, ...savedSearches]);
        toast.success("Search saved successfully");
        setShowSaveDialog(false);
        setSaveName("");
        setSaveDescription("");
        setSaveShared(false);
      } else {
        toast.error("Failed to save search");
      }
    } catch (error) {
      console.error("Save search error:", error);
      toast.error("An error occurred");
    }
  };

  const handleExecuteSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/search/saved/${searchId}/execute`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        onLoadSearch(data.query, data.filters);
        toast.success(`Loaded: ${data.name}`);
      } else {
        toast.error("Failed to execute search");
      }
    } catch (error) {
      console.error("Execute search error:", error);
      toast.error("An error occurred");
    }
  };

  const handleTogglePin = async (searchId: string, currentlyPinned: boolean) => {
    try {
      const response = await fetch(`/api/search/saved/${searchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentlyPinned }),
      });

      if (response.ok) {
        setSavedSearches(
          savedSearches.map((s) =>
            s.id === searchId ? { ...s, is_pinned: !currentlyPinned } : s
          )
        );
        toast.success(currentlyPinned ? "Unpinned" : "Pinned");
      }
    } catch (error) {
      console.error("Toggle pin error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;

    try {
      const response = await fetch(`/api/search/saved/${searchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedSearches(savedSearches.filter((s) => s.id !== searchId));
        toast.success("Search deleted");
      } else {
        toast.error("Failed to delete search");
      }
    } catch (error) {
      console.error("Delete search error:", error);
      toast.error("An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pinnedSearches = savedSearches.filter((s) => s.is_pinned);
  const regularSearches = savedSearches.filter((s) => !s.is_pinned);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Searches
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!currentQuery.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Save Current
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading...
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No saved searches yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Save searches to quickly access them later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Searches */}
              {pinnedSearches.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Pinned
                  </h4>
                  <div className="space-y-2">
                    {pinnedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="p-3 border rounded-lg hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-sm truncate">
                                {search.name}
                              </h5>
                              {search.is_shared && (
                                <Share2 className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            {search.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {search.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Used {search.usage_count} times • {formatDate(search.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleExecuteSearch(search.id)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleTogglePin(search.id, search.is_pinned)}
                            >
                              <Star
                                className={`h-3 w-3 ${
                                  search.is_pinned ? "fill-yellow-400 text-yellow-400" : ""
                                }`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => handleDeleteSearch(search.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Searches */}
              {regularSearches.length > 0 && (
                <div>
                  {pinnedSearches.length > 0 && (
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      All Searches
                    </h4>
                  )}
                  <div className="space-y-2">
                    {regularSearches.map((search) => (
                      <div
                        key={search.id}
                        className="p-3 border rounded-lg hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-sm truncate">
                                {search.name}
                              </h5>
                              {search.is_shared && (
                                <Share2 className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            {search.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {search.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Used {search.usage_count} times • {formatDate(search.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleExecuteSearch(search.id)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleTogglePin(search.id, search.is_pinned)}
                            >
                              <Star
                                className={`h-3 w-3 ${
                                  search.is_pinned ? "fill-yellow-400 text-yellow-400" : ""
                                }`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => handleDeleteSearch(search.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save your current search and filters for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My Important Search"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="What is this search for?"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shared"
                className="h-4 w-4 rounded border-gray-300"
                checked={saveShared}
                onChange={(e) => setSaveShared(e.target.checked)}
              />
              <Label htmlFor="shared" className="cursor-pointer">
                <div className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  Share with organization
                </div>
              </Label>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-muted-foreground">Query: {currentQuery}</p>
              {Object.keys(currentFilters).length > 0 && (
                <p className="text-muted-foreground mt-1">
                  Filters: {Object.keys(currentFilters).length} active
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>Save Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
