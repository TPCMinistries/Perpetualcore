"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  FolderIcon,
  TrendingUp,
  Clock,
  BarChart3,
  BookOpen,
  Sparkles,
  ArrowRight,
  Calendar,
  Search,
  Tag,
  Star,
  MessageSquare,
  Eye,
  Filter,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentChatModal } from "@/components/documents/DocumentChatModal";

interface DocumentStats {
  total: number;
  byType: Record<string, number>;
  withSummaries: number;
  totalCost: number;
  recentCount: number;
}

interface FolderStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  documentCount: number;
  recentActivity: string;
}

interface RecentDocument {
  id: string;
  title: string;
  document_type: string | null;
  summary: string | null;
  created_at: string;
  folder?: {
    name: string;
    color: string;
  };
}

interface PopularDocument {
  id: string;
  title: string;
  document_type: string | null;
  access_count: number;
  last_accessed: string;
}

interface TagStats {
  tag: string;
  count: number;
  color: string;
}

export default function KnowledgeLibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    byType: {},
    withSummaries: 0,
    totalCost: 0,
    recentCount: 0,
  });
  const [folders, setFolders] = useState<FolderStats[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [tags, setTags] = useState<TagStats[]>([]);
  const [allDocs, setAllDocs] = useState<RecentDocument[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [chatDoc, setChatDoc] = useState<any>(null);
  const [bulkTagging, setBulkTagging] = useState(false);

  useEffect(() => {
    loadKnowledgeLibraryData();
  }, []);

  async function loadKnowledgeLibraryData() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to view your knowledge library");
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("No organization found");
        return;
      }

      // Fetch all documents for stats and search
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("id, title, document_type, summary, summary_cost_usd, created_at, folder_id")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      // Calculate stats
      const docsByType: Record<string, number> = {};
      let withSummaries = 0;
      let totalCost = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      documents?.forEach((doc) => {
        // Count by type
        const type = doc.document_type || "Uncategorized";
        docsByType[type] = (docsByType[type] || 0) + 1;

        // Count summaries
        if (doc.summary) withSummaries++;

        // Sum costs
        if (doc.summary_cost_usd) {
          totalCost += parseFloat(doc.summary_cost_usd);
        }
      });

      const recentCount = documents?.filter(
        (doc) => new Date(doc.created_at) >= thirtyDaysAgo
      ).length || 0;

      setStats({
        total: documents?.length || 0,
        byType: docsByType,
        withSummaries,
        totalCost,
        recentCount,
      });

      setAllDocs(documents || []);

      // Fetch folders with document counts
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("id, name, color, icon, updated_at")
        .eq("organization_id", profile.organization_id);

      if (foldersError) throw foldersError;

      // Count documents per folder
      const foldersWithCounts: FolderStats[] = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("folder_id", folder.id)
            .eq("status", "completed");

          return {
            id: folder.id,
            name: folder.name,
            color: folder.color,
            icon: folder.icon,
            documentCount: count || 0,
            recentActivity: folder.updated_at,
          };
        })
      );

      setFolders(foldersWithCounts);

      // Fetch recent documents with summaries (without nested folder query to avoid schema cache issues)
      const { data: recent, error: recentError } = await supabase
        .from("documents")
        .select("id, title, document_type, summary, created_at, folder_id")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .not("summary", "is", null)
        .order("summary_generated_at", { ascending: false })
        .limit(6);

      if (recentError) {
        console.error("Error fetching recent documents:", recentError);
      }

      setRecentDocs(recent || []);

      // Fetch tags stats (simplified to avoid schema cache issues)
      const { data: tagsData, error: tagsError } = await supabase
        .from("document_tags")
        .select("tag_id, document_id");

      if (!tagsError && tagsData && tagsData.length > 0) {
        // Get unique tag IDs
        const tagIds = Array.from(new Set(tagsData.map((dt: any) => dt.tag_id).filter(Boolean)));

        if (tagIds.length > 0) {
          // Fetch tag details separately
          const { data: tagsDetails, error: tagsDetailsError } = await supabase
            .from("tags")
            .select("id, name, color")
            .in("id", tagIds);

          if (!tagsDetailsError && tagsDetails) {
            // Count occurrences of each tag
            const tagCounts: Record<string, { count: number; name: string; color: string }> = {};
            tagsData.forEach((item: any) => {
              if (item.tag_id) {
                const tagDetail = tagsDetails.find((t: any) => t.id === item.tag_id);
                if (tagDetail) {
                  if (!tagCounts[item.tag_id]) {
                    tagCounts[item.tag_id] = { count: 0, name: tagDetail.name, color: tagDetail.color };
                  }
                  tagCounts[item.tag_id].count++;
                }
              }
            });

            const tagsArray = Object.values(tagCounts)
              .map((data) => ({
                tag: data.name,
                count: data.count,
                color: data.color,
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 15);

            setTags(tagsArray);
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading knowledge library:", error);
      // Don't show error toast - page can still function with partial data
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleSemanticSearch() {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 20 }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      if (data.fallback) {
        toast.info(data.message || "Using text-based search");
      } else {
        toast.success(`Found ${data.results?.length || 0} relevant documents`);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to search knowledge base");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleBulkAutoTag() {
    setBulkTagging(true);

    try {
      const response = await fetch("/api/knowledge/bulk-auto-tag", {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Bulk tagging failed");
      }

      const data = await response.json();
      toast.success(data.message || "Bulk auto-tagging completed!", {
        description: `Tagged ${data.tagged_count} documents`,
      });

      // Refresh the page data
      loadKnowledgeLibraryData();
    } catch (error: any) {
      console.error("Bulk tagging error:", error);
      toast.error(error.message || "Failed to perform bulk tagging");
    } finally {
      setBulkTagging(false);
    }
  }

  function handleUploadComplete(files: UploadedFile[]) {
    toast.success(`${files.length} file(s) uploaded and added to your knowledge library!`, {
      action: {
        label: "View Documents",
        onClick: () => router.push("/dashboard/documents"),
      },
    });
    // Refresh stats to show new uploads
    loadKnowledgeLibraryData();
    setShowUpload(false);
  }

  function getTagSize(count: number, maxCount: number) {
    const minSize = 0.75;
    const maxSize = 1.5;
    const ratio = count / maxCount;
    return minSize + (ratio * (maxSize - minSize));
  }

  const filteredDocs = allDocs.filter((doc) => {
    if (selectedFilter && doc.document_type !== selectedFilter) {
      return false;
    }
    return true;
  });

  const maxTagCount = Math.max(...tags.map(t => t.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your knowledge library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Knowledge Library
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Your centralized knowledge hub with AI-powered insights
                </p>
              </div>
            </div>
            <Link href="/dashboard/documents">
              <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                <FileText className="h-4 w-4 mr-2" />
                View All Documents
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ask anything about your documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSemanticSearch()}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                disabled={isSearching}
              />
            </div>
            <Button
              onClick={handleSemanticSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Search
                </>
              )}
            </Button>
            <Button
              onClick={handleBulkAutoTag}
              disabled={bulkTagging}
              variant="outline"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {bulkTagging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tagging...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Bulk Tag
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
              {showUpload ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </Card>

        {/* Upload Section - Collapsible */}
        {showUpload && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <Upload className="h-5 w-5 text-white dark:text-slate-900" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upload to Knowledge Library</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Files uploaded here are automatically indexed and searchable
                </p>
              </div>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
                <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.total}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI Summaries</p>
                <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.withSummaries}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stats.total > 0
                    ? `${Math.round((stats.withSummaries / stats.total) * 100)}% coverage`
                    : "0% coverage"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Recent Activity</p>
                <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.recentCount}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Last 30 days</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Filters */}
        {Object.keys(stats.byType).length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Quick Filter:</span>
              <button
                onClick={() => setSelectedFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedFilter === null
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All ({stats.total})
              </button>
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedFilter === type
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {type} ({count})
                  </button>
                ))}
              {selectedFilter && (
                <button
                  onClick={() => setSelectedFilter(null)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Types Distribution */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Document Types Distribution
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / stats.total) * 100;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{type}</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(stats.byType).length === 0 && (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No document types yet. Upload documents to see distribution.
                </p>
              )}
            </div>
          </Card>

          {/* Tags Cloud */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Popular Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const size = getTagSize(tag.count, maxTagCount);
                return (
                  <Link
                    key={tag.tag}
                    href={`/dashboard/documents?tag=${encodeURIComponent(tag.tag)}`}
                  >
                    <div
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-all hover:scale-105 cursor-pointer text-slate-900 dark:text-slate-100"
                      style={{
                        fontSize: `${size}rem`,
                      }}
                    >
                      {tag.tag}
                      <span className="ml-1.5 text-xs opacity-75">
                        ({tag.count})
                      </span>
                    </div>
                  </Link>
                );
              })}
              {tags.length === 0 && (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8 w-full">
                  No tags yet. Tag documents to organize your knowledge.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Folders Overview - Full Width */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Folders
            </h2>
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {folders.map((folder) => {
              // Check if icon is actually an emoji or just text
              const isEmoji = folder.icon && folder.icon.length <= 2 && /\p{Emoji}/u.test(folder.icon);
              const displayIcon = isEmoji ? folder.icon : "📁";

              return (
                <Link
                  key={folder.id}
                  href={`/dashboard/documents?folder=${folder.id}`}
                >
                  <div className="group p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-100 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">
                        <span className="text-3xl">{displayIcon}</span>
                      </div>
                      <div className="w-full">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mb-1">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {folder.documentCount} {folder.documentCount === 1 ? "document" : "documents"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {folders.length === 0 && (
              <div className="col-span-full">
                <p className="text-slate-600 dark:text-slate-400 text-center py-12">
                  No folders yet. Create folders to organize your documents.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Summaries - Full Width */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Recent AI Summaries
            </h2>
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDocs.map((doc) => (
              <Link key={doc.id} href={`/dashboard/documents?id=${doc.id}`}>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer h-full">
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-1 flex-1">
                            {doc.title}
                          </h3>
                          {doc.document_type && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full flex-shrink-0">
                              {doc.document_type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-2">
                          {doc.summary}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1" suppressHydrationWarning>
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {recentDocs.length === 0 && (
              <div className="col-span-full">
                <p className="text-slate-600 dark:text-slate-400 text-center py-12">
                  No summaries generated yet. Generate summaries from the Documents page.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Search Results Panel */}
        {showSearchResults && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Brain className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                AI Search Results
                {searchResults.length > 0 && (
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                    ({searchResults.length} documents)
                  </span>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {searchResults.length === 0 && !isSearching && (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No results found. Try a different search query.
                </p>
              )}

              {searchResults.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </h3>
                        {doc.document_type && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full flex-shrink-0">
                            {doc.document_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {doc.summary || doc.content?.substring(0, 150) + "..."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewDoc({
                            id: doc.id,
                            title: doc.title,
                            file_type: doc.file_type || "text/plain",
                            file_url: doc.file_url,
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                        onClick={() => {
                          setChatDoc({
                            id: doc.id,
                            title: doc.title,
                          });
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <DocumentPreviewModal
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        document={previewDoc}
      />

      <DocumentChatModal
        open={!!chatDoc}
        onClose={() => setChatDoc(null)}
        documentId={chatDoc?.id || ""}
        documentTitle={chatDoc?.title || ""}
      />
    </div>
  );
}
