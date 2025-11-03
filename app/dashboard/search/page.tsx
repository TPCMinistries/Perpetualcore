"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  FileText,
  MessageSquare,
  CheckSquare,
  Calendar,
  Mail,
  Filter,
  Sparkles,
  Clock,
  User,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedSearchFilters, SearchFilters } from "@/components/search/AdvancedSearchFilters";
import { SavedSearches } from "@/components/search/SavedSearches";

interface SearchResult {
  id: string;
  type: "conversation" | "document" | "task" | "calendar" | "email";
  title: string;
  content: string;
  snippet: string;
  score: number;
  metadata: {
    date?: string;
    author?: string;
    status?: string;
    priority?: string;
    category?: string;
    location?: string;
    from?: string;
    to?: string[];
    [key: string]: any;
  };
  url: string;
}

interface SearchCounts {
  conversations: number;
  documents: number;
  tasks: number;
  calendar: number;
  email: number;
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<SearchCounts>({
    conversations: 0,
    documents: 0,
    tasks: 0,
    calendar: 0,
    email: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, searchFilters: SearchFilters = {}) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });

      // Add filters to query params
      if (searchFilters.types && searchFilters.types.length > 0) {
        params.append("types", searchFilters.types.join(","));
      }
      if (searchFilters.dateFrom) params.append("dateFrom", searchFilters.dateFrom);
      if (searchFilters.dateTo) params.append("dateTo", searchFilters.dateTo);
      if (searchFilters.status) params.append("status", searchFilters.status);
      if (searchFilters.priority) params.append("priority", searchFilters.priority);
      if (searchFilters.authors && searchFilters.authors.length > 0) {
        params.append("authors", searchFilters.authors.join(","));
      }
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        params.append("tags", searchFilters.tags.join(","));
      }
      if (searchFilters.categories && searchFilters.categories.length > 0) {
        params.append("categories", searchFilters.categories.join(","));
      }
      if (searchFilters.location) params.append("location", searchFilters.location);
      if (searchFilters.hasAttachments) params.append("hasAttachments", "true");

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setCounts(data.counts || {
          conversations: 0,
          documents: 0,
          tasks: 0,
          calendar: 0,
          email: 0,
          total: 0,
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
      performSearch(query, filters);
    }
  };

  const handleLoadSavedSearch = (savedQuery: string, savedFilters: SearchFilters) => {
    setQuery(savedQuery);
    setFilters(savedFilters);
    router.push(`/dashboard/search?q=${encodeURIComponent(savedQuery)}`);
    performSearch(savedQuery, savedFilters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query.trim().length >= 2) {
      performSearch(query, newFilters);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    if (query.trim().length >= 2) {
      performSearch(query, {});
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "conversation":
        return <MessageSquare className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      case "calendar":
        return <Calendar className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "conversation":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30";
      case "document":
        return "text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30";
      case "task":
        return "text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border-green-500/30";
      case "calendar":
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30";
      case "email":
        return "text-pink-600 dark:text-pink-400 bg-pink-500/10 dark:bg-pink-500/20 border-pink-500/30";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 mb-6 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Search className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Universal Search</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Search across all your conversations, documents, tasks, calendar, and emails
              </p>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search everything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 px-6 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? "Hide" : "Filters"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className="h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Filter className="h-4 w-4 mr-2" />
                Saved
              </Button>
            </div>
          </form>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Saved Searches */}
          {showSavedSearches && (
            <div className="lg:col-span-3">
              <SavedSearches
                onLoadSearch={handleLoadSavedSearch}
                currentQuery={query}
                currentFilters={filters}
              />
            </div>
          )}

          {/* Main Results Area */}
          <div className={showSavedSearches ? "lg:col-span-9" : "lg:col-span-12"}>
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mb-6">
                <AdvancedSearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            )}

            {/* Results count */}
            {counts.total > 0 && (
              <div className="mb-6 flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {counts.total} {counts.total === 1 ? "result" : "results"}
                </span>
                <div className="flex items-center gap-4">
                  {counts.conversations > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {counts.conversations}
                    </span>
                  )}
                  {counts.documents > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {counts.documents}
                    </span>
                  )}
                  {counts.tasks > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-4 w-4" />
                      {counts.tasks}
                    </span>
                  )}
                  {counts.calendar > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {counts.calendar}
                    </span>
                  )}
                  {counts.email > 0 && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {counts.email}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-12">
                  <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-white dark:text-slate-900 animate-pulse" />
                  </div>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">Searching...</p>
                </div>
              </div>
            ) : results.length === 0 && query ? (
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-12 text-center">
                <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  No results found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  No results found for <span className="font-semibold text-slate-900 dark:text-slate-100">"{query}"</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Try different keywords or check your filters
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-12 text-center">
                <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Universal Search
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start typing to search across all your content
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <MessageSquare className="h-3 w-3" /> Conversations
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <FileText className="h-3 w-3" /> Documents
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <CheckSquare className="h-3 w-3" /> Tasks
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Calendar className="h-3 w-3" /> Calendar
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Mail className="h-3 w-3" /> Emails
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(result.url)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border ${getTypeColor(
                              result.type
                            )}`}
                          >
                            {getTypeIcon(result.type)}
                            <span className="font-medium capitalize">{result.type}</span>
                          </span>
                          {result.metadata.aiExtracted && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          )}
                        </div>
                        {result.metadata.date && (
                          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(result.metadata.date)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                        {result.title}
                      </h3>

                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {result.snippet}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        {result.metadata.author && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <User className="h-3 w-3" />
                            {result.metadata.author}
                          </span>
                        )}
                        {result.metadata.from && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <Mail className="h-3 w-3" />
                            {result.metadata.from}
                          </span>
                        )}
                        {result.metadata.location && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <MapPin className="h-3 w-3" />
                            {result.metadata.location}
                          </span>
                        )}
                        {result.metadata.status && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {result.metadata.status}
                          </span>
                        )}
                        {result.metadata.priority && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {result.metadata.priority} priority
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1 text-slate-900 dark:text-slate-100 font-medium">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
