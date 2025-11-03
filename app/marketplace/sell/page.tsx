"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Package,
  Star,
  Users,
  Download,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Wallet,
  Clock,
} from "lucide-react";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with actual API calls
  const stats = {
    totalEarnings: 12450,
    pendingPayout: 2340,
    totalSales: 856,
    activeListings: 8,
    averageRating: 4.8,
    totalReviews: 124,
  };

  const listings = [
    {
      id: "1",
      type: "agent",
      name: "Legal Document Analyzer",
      status: "approved",
      price: 99,
      pricing_type: "one_time",
      total_sales: 856,
      total_revenue: 84744,
      average_rating: 4.8,
      review_count: 124,
      created_at: "2024-12-15",
    },
    {
      id: "2",
      type: "workflow",
      name: "Contract Review Automation",
      status: "approved",
      price: 49,
      pricing_type: "subscription",
      subscription_interval: "monthly",
      total_sales: 234,
      total_revenue: 11466,
      average_rating: 4.6,
      review_count: 45,
      created_at: "2024-11-20",
    },
    {
      id: "3",
      type: "agent",
      name: "Legal Research Assistant",
      status: "pending_review",
      price: 149,
      pricing_type: "one_time",
      total_sales: 0,
      total_revenue: 0,
      average_rating: 0,
      review_count: 0,
      created_at: "2025-01-18",
    },
  ];

  const recentSales = [
    {
      id: "1",
      item_name: "Legal Document Analyzer",
      buyer: "Sarah M.",
      price: 99,
      creator_payout: 69.3,
      date: "2025-01-20",
    },
    {
      id: "2",
      item_name: "Contract Review Automation",
      buyer: "John D.",
      price: 49,
      creator_payout: 34.3,
      date: "2025-01-19",
    },
    {
      id: "3",
      item_name: "Legal Document Analyzer",
      buyer: "Emily R.",
      price: 99,
      creator_payout: 69.3,
      date: "2025-01-18",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Seller Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button asChild>
              <Link href="/marketplace/sell/new">
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                70% commission on all sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingPayout.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
              <Button size="sm" className="mt-2" variant="outline">
                Request Payout
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.activeListings} listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">
                Approved and published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.totalReviews} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Unique buyers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="sales">Recent Sales</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Start earning passive income by selling your AI agents and workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Create Your Listing</div>
                    <div className="text-sm text-muted-foreground">
                      Upload your AI agent or workflow with detailed description and pricing
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Get Approved</div>
                    <div className="text-sm text-muted-foreground">
                      Our team reviews your submission (typically within 24 hours)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Start Earning</div>
                    <div className="text-sm text-muted-foreground">
                      Earn 70% commission on every sale, paid out monthly
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button asChild>
                    <Link href="/marketplace/sell/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Listing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{sale.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Purchased by {sale.buyer} • {new Date(sale.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${sale.price}</div>
                        <div className="text-sm text-green-600">
                          +${sale.creator_payout} earned
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">My Listings</h2>
                <p className="text-muted-foreground">
                  Manage your marketplace items
                </p>
              </div>
              <Button asChild>
                <Link href="/marketplace/sell/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Item
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {listings.map((listing) => (
                <Card key={listing.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{listing.name}</CardTitle>
                          <Badge
                            variant={
                              listing.status === "approved"
                                ? "default"
                                : listing.status === "pending_review"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {listing.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">
                            {listing.type === "agent" ? "AI Agent" : "Workflow"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Created {new Date(listing.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/marketplace/${listing.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/marketplace/sell/edit/${listing.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Price</div>
                        <div className="font-medium">
                          ${listing.price}
                          {listing.pricing_type === "subscription" && (
                            <span className="text-xs text-muted-foreground">
                              /{listing.subscription_interval}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Sales</div>
                        <div className="font-medium">{listing.total_sales.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-medium text-green-600">
                          ${(listing.total_revenue * 0.7).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Rating</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{listing.average_rating || "N/A"}</span>
                          <span className="text-muted-foreground">
                            ({listing.review_count})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  All transactions from the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Download className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{sale.item_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Purchased by {sale.buyer}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${sale.price}</div>
                        <div className="text-sm text-green-600">
                          +${sale.creator_payout} earned
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(sale.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Coming Soon</CardTitle>
                <CardDescription>
                  Detailed insights into your sales performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Advanced analytics features are coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
