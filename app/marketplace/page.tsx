"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Star, TrendingUp, Zap, Bot, Workflow, DollarSign, Users } from "lucide-react";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  // Mock data - replace with actual API call
  const marketplaceItems = [
    {
      id: "1",
      type: "agent",
      name: "Legal Document Analyzer",
      description: "AI agent that analyzes legal documents and extracts key clauses, risks, and recommendations.",
      price: 99,
      pricing_type: "one_time",
      category: "Legal",
      rating: 4.8,
      reviews: 124,
      sales: 856,
      thumbnail: null,
      tags: ["legal", "document-analysis", "contracts"],
      creator: { name: "LawTech AI", verified: true },
    },
    {
      id: "2",
      type: "workflow",
      name: "Patient Intake Automation",
      description: "Complete workflow for automating patient intake, insurance verification, and appointment scheduling.",
      price: 29,
      pricing_type: "subscription",
      subscription_interval: "monthly",
      category: "Healthcare",
      rating: 4.9,
      reviews: 89,
      sales: 543,
      thumbnail: null,
      tags: ["healthcare", "automation", "intake"],
      creator: { name: "MedFlow", verified: true },
    },
    {
      id: "3",
      type: "agent",
      name: "Real Estate Property Matcher",
      description: "Intelligent agent that matches clients with properties based on preferences, budget, and lifestyle.",
      price: 149,
      pricing_type: "one_time",
      category: "Real Estate",
      rating: 4.7,
      reviews: 67,
      sales: 421,
      thumbnail: null,
      tags: ["real-estate", "matching", "crm"],
      creator: { name: "PropTech Solutions", verified: false },
    },
    {
      id: "4",
      type: "workflow",
      name: "Social Media Content Pipeline",
      description: "Automated workflow for generating, scheduling, and posting social media content across platforms.",
      price: 49,
      pricing_type: "subscription",
      subscription_interval: "monthly",
      category: "Marketing",
      rating: 4.6,
      reviews: 156,
      sales: 789,
      thumbnail: null,
      tags: ["marketing", "social-media", "automation"],
      creator: { name: "Content AI", verified: true },
    },
  ];

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
              Discover and purchase pre-built AI agents and workflows created by the community
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents, workflows..."
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
              <div className="text-3xl font-bold text-primary mb-2">2,400+</div>
              <div className="text-sm text-muted-foreground">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1,800+</div>
              <div className="text-sm text-muted-foreground">Workflows</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15K+</div>
              <div className="text-sm text-muted-foreground">Satisfied Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">$2.1M</div>
              <div className="text-sm text-muted-foreground">Paid to Creators</div>
            </div>
          </div>
        </div>
      </section>

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
              Showing {marketplaceItems.length} items
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Items Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceItems.map((item) => (
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
                    <Badge variant="secondary">{item.category}</Badge>
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

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{item.rating}</span>
                      <span>({item.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{item.sales.toLocaleString()} sales</span>
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      by {item.creator.name}
                      {item.creator.verified && (
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
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Want to Sell Your AI Agents or Workflows?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators earning passive income. List your creations and earn 70% of every sale.
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
