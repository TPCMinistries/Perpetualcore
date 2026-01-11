"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Filter,
  Bookmark,
  BookmarkPlus,
  Loader2,
  X,
  Building2,
  Tag,
  MapPin,
  Briefcase,
  Users,
  Clock,
  Check,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: Record<string, any>;
  is_pinned: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
}

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

export interface SearchFilters {
  search?: string;
  type?: string;
  relationship_strength?: string;
  company?: string;
  job_title?: string;
  industry?: string;
  location?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  isFavorite?: boolean;
  needsFollowup?: boolean;
  recentlyContacted?: boolean;
}

const contactTypeOptions = [
  { value: "contact", label: "Contact" },
  { value: "investor", label: "Investor" },
  { value: "partner", label: "Partner" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "mentor", label: "Mentor" },
  { value: "advisor", label: "Advisor" },
  { value: "team", label: "Team Member" },
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
];

const strengthOptions = [
  { value: "inner_circle", label: "Inner Circle" },
  { value: "close", label: "Close" },
  { value: "connected", label: "Connected" },
  { value: "acquaintance", label: "Acquaintance" },
  { value: "new", label: "New" },
];

export function AdvancedSearchModal({
  open,
  onOpenChange,
  onSearch,
  currentFilters = {},
}: AdvancedSearchModalProps) {
  const [activeTab, setActiveTab] = useState("filters");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchSavedSearches();
      fetchFilterOptions();
      setFilters(currentFilters);
    }
  }, [open, currentFilters]);

  const fetchSavedSearches = async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch("/api/search/saved");
      if (response.ok) {
        const data = await response.json();
        // Filter for contact-related searches
        const contactSearches = (data.savedSearches || []).filter(
          (s: SavedSearch) => s.filters?.type === "contacts" || !s.filters?.type
        );
        setSavedSearches(contactSearches);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch available companies
      const companiesRes = await fetch("/api/contacts?limit=100&distinct=company");
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        const uniqueCompanies = [...new Set(
          (data.contacts || [])
            .map((c: any) => c.company)
            .filter(Boolean)
        )] as string[];
        setCompanies(uniqueCompanies.slice(0, 50));
      }

      // Fetch available tags
      const tagsRes = await fetch("/api/contacts?limit=100");
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const allTags = (data.contacts || []).flatMap((c: any) => c.tags || []);
        const uniqueTags = [...new Set(allTags)] as string[];
        setSuggestedTags(uniqueTags.slice(0, 30));
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/search/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchName,
          query: filters.search || "",
          filters: { ...filters, type: "contacts" },
          is_pinned: false,
          is_shared: false,
        }),
      });

      if (response.ok) {
        toast.success("Search saved successfully");
        setSearchName("");
        setShowSaveInput(false);
        fetchSavedSearches();
      } else {
        toast.error("Failed to save search");
      }
    } catch (error) {
      toast.error("Failed to save search");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Search deleted");
        setSavedSearches(savedSearches.filter(s => s.id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete search");
    }
  };

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    const loadedFilters: SearchFilters = {
      search: savedSearch.query,
      ...savedSearch.filters,
    };
    setFilters(loadedFilters);
    setActiveTab("filters");
    toast.success(`Loaded "${savedSearch.name}"`);
  };

  const handleApplyFilters = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags?.includes(tag)) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), tag],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFilters({
      ...filters,
      tags: filters.tags?.filter(t => t !== tag) || [],
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value;
      return Boolean(value);
    }
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-violet-500" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Build complex queries and save searches for quick access
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Searches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="flex-1 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Text Search */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Query
                  </Label>
                  <Input
                    placeholder="Search names, emails, notes..."
                    value={filters.search || ""}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                {/* Type and Strength */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contact Type
                    </Label>
                    <Select
                      value={filters.type || ""}
                      onValueChange={(value) => setFilters({ ...filters, type: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any type</SelectItem>
                        {contactTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Relationship
                    </Label>
                    <Select
                      value={filters.relationship_strength || ""}
                      onValueChange={(value) => setFilters({ ...filters, relationship_strength: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any strength" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any strength</SelectItem>
                        {strengthOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Company and Job Title */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start font-normal"
                        >
                          {filters.company || "Any company"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search companies..." />
                          <CommandList>
                            <CommandEmpty>No companies found</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => setFilters({ ...filters, company: undefined })}
                              >
                                Any company
                              </CommandItem>
                              {companies.map((company) => (
                                <CommandItem
                                  key={company}
                                  onSelect={() => setFilters({ ...filters, company })}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      filters.company === company ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {company}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Title
                    </Label>
                    <Input
                      placeholder="e.g. CEO, Engineer..."
                      value={filters.job_title || ""}
                      onChange={(e) => setFilters({ ...filters, job_title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Industry and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Industry
                    </Label>
                    <Input
                      placeholder="e.g. Technology, Finance..."
                      value={filters.industry || ""}
                      onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      placeholder="e.g. New York, London..."
                      value={filters.location || ""}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(filters.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addTag(tagInput)}
                      disabled={!tagInput}
                    >
                      Add
                    </Button>
                  </div>
                  {suggestedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground mr-2">Suggested:</span>
                      {suggestedTags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                          disabled={filters.tags?.includes(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <Label>Quick Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.isFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, isFavorite: !filters.isFavorite })}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Favorites
                    </Button>
                    <Button
                      variant={filters.needsFollowup ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, needsFollowup: !filters.needsFollowup })}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Needs Follow-up
                    </Button>
                    <Button
                      variant={filters.hasEmail ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, hasEmail: !filters.hasEmail })}
                    >
                      Has Email
                    </Button>
                    <Button
                      variant={filters.hasPhone ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, hasPhone: !filters.hasPhone })}
                    >
                      Has Phone
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Save Search */}
            <div className="mt-4 pt-4 border-t">
              {showSaveInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Name this search..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveSearch();
                    }}
                  />
                  <Button onClick={handleSaveSearch} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowSaveInput(false);
                      setSearchName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSaveInput(true)}
                  className="w-full"
                  disabled={activeFilterCount === 0}
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save This Search
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="flex-1 mt-4">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No saved searches yet</p>
                <p className="text-sm mt-1">
                  Create filters and save them for quick access
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleLoadSavedSearch(search)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{search.name}</span>
                          {search.is_pinned && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {search.query && (
                          <p className="text-sm text-muted-foreground truncate">
                            Query: {search.query}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {search.usage_count} uses
                          </Badge>
                          {search.is_shared && (
                            <Badge variant="secondary" className="text-xs">
                              Shared
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleLoadSavedSearch(search)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSavedSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters} className="bg-violet-600 hover:bg-violet-700">
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
