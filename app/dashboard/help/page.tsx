"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  FileText,
  Zap,
  Shield,
  Code,
  Settings,
  ExternalLink,
  ChevronRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const popularArticles = [
    {
      title: "Getting Started with Perpetual Core",
      category: "Getting Started",
      icon: Zap,
      readTime: "5 min read",
      url: "/docs/getting-started",
    },
    {
      title: "How to Create Your First AI Agent",
      category: "AI Agents",
      icon: Code,
      readTime: "8 min read",
      url: "/docs/ai-agents/create",
    },
    {
      title: "Security & Privacy Best Practices",
      category: "Security",
      icon: Shield,
      readTime: "6 min read",
      url: "/docs/security",
    },
    {
      title: "API Documentation",
      category: "Developers",
      icon: Code,
      readTime: "10 min read",
      url: "/docs/api",
    },
    {
      title: "Workflow Automation Guide",
      category: "Workflows",
      icon: Zap,
      readTime: "12 min read",
      url: "/docs/workflows",
    },
    {
      title: "Team Collaboration Features",
      category: "Teams",
      icon: MessageCircle,
      readTime: "7 min read",
      url: "/docs/teams",
    },
  ];

  const categories = [
    {
      title: "Getting Started",
      description: "Learn the basics and get up and running quickly",
      icon: Zap,
      count: 12,
      color: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "AI Features",
      description: "Understand AI agents, workflows, and assistants",
      icon: Code,
      count: 28,
      color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Integration",
      description: "Connect with your favorite tools and services",
      icon: Settings,
      count: 15,
      color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Security & Privacy",
      description: "Data protection and compliance information",
      icon: Shield,
      count: 10,
      color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    },
    {
      title: "API & Developers",
      description: "Technical documentation and API references",
      icon: FileText,
      count: 22,
      color: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Troubleshooting",
      description: "Common issues and how to resolve them",
      icon: HelpCircle,
      count: 18,
      color: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
    },
  ];

  const quickLinks = [
    {
      title: "Watch Video Tutorials",
      icon: Video,
      url: "/tutorials",
      description: "Step-by-step video guides",
    },
    {
      title: "Contact Support",
      icon: MessageCircle,
      url: "/dashboard/support",
      description: "Get help from our team",
    },
    {
      title: "Community Forum",
      icon: MessageCircle,
      url: "https://community.aios-platform.com",
      external: true,
      description: "Connect with other users",
    },
    {
      title: "System Status",
      icon: Activity,
      url: "/status",
      description: "Check service uptime",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="text-center max-w-3xl mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            How can we help you?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Search our knowledge base or browse categories below
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, and tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            href={link.url}
            target={link.external ? "_blank" : undefined}
            className="group"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                    <link.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-slate-900 dark:text-slate-100 transition-colors flex items-center gap-2">
                      {link.title}
                      {link.external && <ExternalLink className="h-3 w-3" />}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{link.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.title} href={`/help/${category.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`h-12 w-12 rounded-xl ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="border-slate-200 dark:border-slate-700">{category.count} articles</Badge>
                  </div>
                  <CardTitle className="text-slate-900 dark:text-slate-100 transition-colors flex items-center justify-between">
                    {category.title}
                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-slate-400" />
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Articles */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Popular Articles</h2>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="space-y-4">
              {popularArticles.map((article, index) => (
                <Link
                  key={article.title}
                  href={article.url}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                    <article.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 transition-colors">
                        {article.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">{article.category}</Badge>
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Still Need Help */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Still need help?</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
              <Link href="/dashboard/support">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-slate-200 dark:border-slate-800">
              <Link href="https://community.aios-platform.com" target="_blank">
                Join Community
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
