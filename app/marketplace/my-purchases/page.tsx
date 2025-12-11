"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  Star,
  Calendar,
  DollarSign,
  Bot,
  Workflow,
  ExternalLink,
  Package,
  Loader2,
  Play,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface Purchase {
  id: string;
  item: {
    id: string;
    name: string;
    type: "agent" | "workflow";
    description: string;
    category: string;
    creator_name: string;
  };
  purchase_type: "one_time" | "subscription";
  price_paid: number;
  subscription_status?: string;
  subscription_end_date?: string;
  purchased_at: string;
  status: string;
}

interface Stats {
  totalPurchases: number;
  activeSubscriptions: number;
  totalSpent: number;
}

export default function MyPurchasesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPurchases: 0,
    activeSubscriptions: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function handleActivate(purchase: Purchase) {
    if (!purchase.item?.id) return;

    setActivatingId(purchase.id);
    try {
      const response = await fetch("/api/marketplace/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: purchase.id,
          itemId: purchase.item.id,
          itemType: purchase.item.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate item");
      }

      toast.success(`${purchase.item.name} has been activated!`);

      // Navigate to the appropriate page
      if (purchase.item.type === "agent") {
        router.push("/dashboard/agents");
      } else {
        router.push("/dashboard/workflows");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to activate item";
      toast.error(errorMessage);
    } finally {
      setActivatingId(null);
    }
  }

  async function fetchPurchases() {
    try {
      const response = await fetch("/api/marketplace/purchases");
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
        setStats(data.stats || {
          totalPurchases: 0,
          activeSubscriptions: 0,
          totalSpent: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPurchases = purchases.filter((purchase) =>
    purchase.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.item?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.item?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">My Purchases</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPurchases}</div>
              <p className="text-xs text-muted-foreground">
                AI agents and workflows
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                Recurring monthly
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your purchases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Purchases List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading purchases...</span>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchases found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Browse the marketplace to find AI agents and workflows"}
                </p>
                <Button asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {purchase.item?.type === "agent" ? (
                          <Bot className="h-6 w-6 text-primary" />
                        ) : (
                          <Workflow className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{purchase.item?.name || "Unknown Item"}</CardTitle>
                          <Badge variant="secondary">{purchase.item?.category || "Unknown"}</Badge>
                          <Badge variant="outline">
                            {purchase.item?.type === "agent" ? "AI Agent" : "Workflow"}
                          </Badge>
                        </div>
                        <CardDescription className="mb-3">
                          {purchase.item?.description || "No description available"}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${purchase.price_paid}</span>
                            {purchase.purchase_type === "subscription" && (
                              <span>/month</span>
                            )}
                          </div>
                        </div>
                        {purchase.subscription_status === "active" && purchase.subscription_end_date && (
                          <div className="mt-2">
                            <Badge variant="default" className="text-xs">
                              Active Subscription - Renews{" "}
                              {new Date(purchase.subscription_end_date).toLocaleDateString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/marketplace/${purchase.item?.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivate(purchase)}
                        disabled={activatingId === purchase.id}
                      >
                        {activatingId === purchase.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      by {purchase.item?.creator_name || "Unknown Creator"}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/marketplace/${purchase.item?.id}#reviews`}>
                        <Star className="mr-2 h-4 w-4" />
                        Leave a Review
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
