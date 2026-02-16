"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  TrendingUp,
  Zap,
  Bot,
  Workflow,
  DollarSign,
  Users,
  Plug,
  ShieldCheck,
  Download,
  Flame,
} from "lucide-react";
import { MarketplacePageSkeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

interface MarketplaceItem {
  id: string;
  type: "agent" | "workflow";
  name: string;
  description: string;
  price: number;
  pricing_type: "one_time" | "subscription";
  subscription_interval?: string;
  category: string;
  tags: string[];
  creator_id: string;
  status: string;
  created_at: string;
  // Computed/joined fields
  rating?: number;
  reviews?: number;
  sales?: number;
  creator?: { name: string; verified: boolean };
  // Phase 6 enriched fields
  install_count?: number;
  avg_rating?: number;
  review_count?: number;
  sales_count?: number;
  security_verified?: boolean;
  security_score?: number | null;
}

interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  tags: string[];
  tier: string;
  isBuiltIn: boolean;
  enabled?: boolean;
}

const CATEGORIES = [
  "All",
  "Legal",
  "Healthcare",
  "Real Estate",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Customer Support",
  "Other",
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<MarketplaceItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalWorkflows: 0,
    totalSkills: 0,
    totalPaidToCreators: 0,
  });

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (filter === "skills") {
      fetchSkills();
    } else {
      fetchMarketplaceItems();
    }
  }, [filter, debouncedQuery, sortBy, selectedCategory]);

  // Fetch trending items on mount
  useEffect(() => {
    fetchTrendingItems();
  }, []);

  async function fetchTrendingItems() {
    try {
      const response = await fetch(
        "/api/marketplace/search?sort=popular&limit=4"
      );
      if (response.ok) {
        const data = await response.json();
        setTrendingItems(data.skills || []);
      }
    } catch (error) {
      console.error("Error fetching trending items:", error);
    }
  }

  async function fetchMarketplaceItems() {
    setLoading(true);
    try {
      // Use the new search API for enriched results
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      params.set("sort", sortBy);
      params.set("limit", "50");

      const searchUrl = `/api/marketplace/search?${params.toString()}`;
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        const items = (data.skills || []).map((item: MarketplaceItem) => ({
          ...item,
          rating: item.avg_rating || item.rating || 0,
          reviews: item.review_count || item.reviews || 0,
          sales: item.install_count || item.sales_count || item.sales || 0,
          creator: item.creator || { name: "Creator", verified: false },
        }));

        // Apply type filter client-side
        const typeParam =
          filter === "agents"
            ? "agent"
            : filter === "workflows"
            ? "workflow"
            : "";
        const filtered = typeParam
          ? items.filter((i: MarketplaceItem) => i.type === typeParam)
          : items;

        setMarketplaceItems(filtered);

        // Calculate stats
        const agents =
          items.filter((i: MarketplaceItem) => i.type === "agent").length || 0;
        const workflows =
          items.filter((i: MarketplaceItem) => i.type === "workflow").length ||
          0;
        setStats((prev) => ({
          ...prev,
          totalAgents: agents,
          totalWorkflows: workflows,
        }));
      } else {
        // Fallback to original API
        const typeParam =
          filter === "agents"
            ? "agent"
            : filter === "workflows"
            ? "workflow"
            : "";
        const url = `/api/marketplace/items${typeParam ? `?type=${typeParam}` : ""}`;
        const fallbackResponse = await fetch(url);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const itemsWithDefaults = (data.items || []).map(
            (item: MarketplaceItem) => ({
              ...item,
              rating: item.rating || 0,
              reviews: item.reviews || 0,
              sales: item.sales || 0,
              creator: item.creator || { name: "Creator", verified: false },
            })
          );
          setMarketplaceItems(itemsWithDefaults);
        }
      }
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSkills() {
    setLoading(true);
    try {
      const response = await fetch("/api/skills");
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  }

  // Items are already filtered/sorted from the API
  const filteredItems = marketplaceItems;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core Marketplace</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <Link href="/marketplace/sell" className="text-sm font-medium hover:underline">
              Sell on Marketplace
            </Link>
            <Button asChild>
              <Link href="/marketplace/my-purchases">My Purchases</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              AI Agent & Workflow Marketplace
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover and purchase pre-built AI agents and workflows created by the community.
              Every skill is security-verified before listing.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents, workflows, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="lg">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalAgents || 0}</div>
              <div className="text-sm text-muted-foreground">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalWorkflows || 0}</div>
              <div className="text-sm text-muted-foreground">Workflows</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{skills.length || 12}</div>
              <div className="text-sm text-muted-foreground">Skills</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">70%</div>
              <div className="text-sm text-muted-foreground">Creator Revenue Share</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending / Featured Section */}
      {filter !== "skills" && trendingItems.length > 0 && !debouncedQuery && (
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold">Trending This Week</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingItems.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-orange-200/50 dark:border-orange-800/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                          {item.type === "agent" ? (
                            <Bot className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Workflow className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.security_verified && (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base line-clamp-1">
                        {item.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {item.avg_rating || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {(item.install_count || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          ${item.price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter Chips */}
      {filter !== "skills" && (
        <section className="py-4 border-b bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters & Sort */}
      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="agents">AI Agents</SelectItem>
                  <SelectItem value="workflows">Workflows</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredItems.length} items
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 bg-muted rounded w-16" />
                    <div className="h-8 bg-muted rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filter === "skills" ? (
          /* Skills Grid */
          skills.length === 0 ? (
            <div className="text-center py-12">
              <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No skills available</h3>
              <p className="text-muted-foreground mb-4">
                Skills extend your AI with integrations and capabilities.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills
                .filter((skill) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    skill.name.toLowerCase().includes(q) ||
                    skill.description.toLowerCase().includes(q) ||
                    skill.tags?.some((t) => t.toLowerCase().includes(q))
                  );
                })
                .map((skill) => (
                <Link key={skill.id} href="/dashboard/settings/skills">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${skill.color}20` }}
                        >
                          {skill.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{skill.category}</Badge>
                          {skill.isBuiltIn && (
                            <Badge variant="outline" className="text-xs">Built-in</Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-1">{skill.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {(skill.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {skill.tier === "free" ? "Free" : `${skill.tier} plan`}
                        </div>
                        <Button size="sm">
                          {skill.enabled ? "Manage" : "Install"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Be the first to list an agent or workflow!"}
            </p>
            <Button asChild>
              <Link href="/marketplace/sell">Start Selling</Link>
            </Button>
          </div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/marketplace/${item.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {item.type === "agent" ? (
                        <Bot className="h-6 w-6 text-primary" />
                      ) : (
                        <Workflow className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.security_verified && (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats - install count + rating */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {item.avg_rating || item.rating || 0}
                      </span>
                      <span>({item.review_count || item.reviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>
                        {(
                          item.install_count ||
                          item.sales_count ||
                          item.sales ||
                          0
                        ).toLocaleString()}{" "}
                        installs
                      </span>
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      by {item.creator?.name || "Creator"}
                      {item.creator?.verified && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <DollarSign className="h-5 w-5" />
                      {item.price}
                      {item.pricing_type === "subscription" && (
                        <span className="text-sm text-muted-foreground font-normal">
                          /{item.subscription_interval}
                        </span>
                      )}
                    </div>
                    <Button>View Details</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Want to Sell Your AI Agents or Workflows?
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Join thousands of creators earning passive income. List your creations and earn 70% of every sale.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Every submission goes through our automated security pipeline -- no malware, no exploits, just quality tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/marketplace/sell">
                  Start Selling <TrendingUp className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/marketplace/creator-guide">Creator Guide</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
