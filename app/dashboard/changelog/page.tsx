"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Rocket,
  Sparkles,
  Bug,
  Zap,
  Shield,
  Search,
  Calendar,
  Tag,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  date: string;
  type: "feature" | "improvement" | "bugfix" | "security";
  changes: {
    category: string;
    items: string[];
  }[];
  breaking_changes?: string[];
}

export default function ChangelogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Mock data - in production this would come from your API
  const changelog: ChangelogEntry[] = [
    {
      id: "1",
      version: "2.5.0",
      title: "Advanced AI Training Hub & Enhanced Analytics",
      description: "Major release introducing organizational training capabilities and improved analytics dashboard",
      date: "2025-01-15T10:00:00Z",
      type: "feature",
      changes: [
        {
          category: "New Features",
          items: [
            "Training Hub - Create and manage organizational training modules",
            "AI-powered training content generation from documents",
            "Certificate issuance for completed training programs",
            "Enhanced analytics with custom date ranges and export",
            "Team collaboration features with role-based permissions",
          ],
        },
        {
          category: "Improvements",
          items: [
            "Faster dashboard loading times (40% improvement)",
            "Improved mobile responsiveness across all pages",
            "Better error messages and user feedback",
            "Updated UI components with new gradient themes",
          ],
        },
        {
          category: "Bug Fixes",
          items: [
            "Fixed issue with API key generation",
            "Resolved team invitation email sending",
            "Corrected timezone display in audit logs",
          ],
        },
      ],
    },
    {
      id: "2",
      version: "2.4.1",
      title: "Security Enhancements & Bug Fixes",
      description: "Critical security updates and performance improvements",
      date: "2025-01-08T14:30:00Z",
      type: "security",
      changes: [
        {
          category: "Security",
          items: [
            "Enhanced API key encryption with AES-256",
            "Implemented rate limiting on all public endpoints",
            "Added CSRF protection for form submissions",
            "Updated dependencies to patch CVE-2024-XXXX",
          ],
        },
        {
          category: "Bug Fixes",
          items: [
            "Fixed data export feature for large datasets",
            "Resolved issue with profile avatar uploads",
            "Corrected webhook retry logic",
          ],
        },
      ],
      breaking_changes: [
        "API v1 endpoints deprecated - migrate to v2 by March 2025",
      ],
    },
    {
      id: "3",
      version: "2.4.0",
      title: "Workflow Automation & Integration Updates",
      description: "New workflow builder and third-party integrations",
      date: "2024-12-20T09:00:00Z",
      type: "feature",
      changes: [
        {
          category: "New Features",
          items: [
            "Visual workflow builder with drag-and-drop interface",
            "Slack integration for notifications",
            "Zapier connector for custom automations",
            "Webhook management dashboard",
          ],
        },
        {
          category: "Improvements",
          items: [
            "Redesigned agent configuration interface",
            "Added bulk operations for data management",
            "Improved search functionality with filters",
          ],
        },
      ],
    },
    {
      id: "4",
      version: "2.3.2",
      title: "Performance Optimization",
      description: "Backend improvements for better performance",
      date: "2024-12-10T16:00:00Z",
      type: "improvement",
      changes: [
        {
          category: "Performance",
          items: [
            "Database query optimization reducing load times by 60%",
            "Implemented Redis caching for frequently accessed data",
            "CDN integration for static assets",
            "Reduced bundle size by 30%",
          ],
        },
      ],
    },
    {
      id: "5",
      version: "2.3.1",
      title: "Bug Fixes & Minor Improvements",
      description: "Addressing user-reported issues and edge cases",
      date: "2024-12-01T11:00:00Z",
      type: "bugfix",
      changes: [
        {
          category: "Bug Fixes",
          items: [
            "Fixed agent response streaming issues",
            "Resolved team member permission edge cases",
            "Corrected date formatting in reports",
            "Fixed mobile navigation menu behavior",
          ],
        },
        {
          category: "Improvements",
          items: [
            "Added keyboard shortcuts for common actions",
            "Improved accessibility with ARIA labels",
            "Enhanced error logging for debugging",
          ],
        },
      ],
    },
  ];

  function getTypeIcon(type: string) {
    switch (type) {
      case "feature":
        return Sparkles;
      case "improvement":
        return Zap;
      case "bugfix":
        return Bug;
      case "security":
        return Shield;
      default:
        return Rocket;
    }
  }

  function getTypeBadge(type: string) {
    const variants = {
      feature: { className: "bg-blue-50 border-blue-300 text-blue-700", label: "New Feature" },
      improvement: { className: "bg-purple-50 border-purple-300 text-purple-700", label: "Improvement" },
      bugfix: { className: "bg-orange-50 border-orange-300 text-orange-700", label: "Bug Fix" },
      security: { className: "bg-red-50 border-red-300 text-red-700", label: "Security" },
    };
    const config = variants[type as keyof typeof variants] || variants.feature;

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  }

  const filteredChangelog = changelog.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.version.includes(searchQuery);
    const matchesType = !selectedType || entry.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/20 dark:via-sky-950/20 dark:to-blue-950/20 border border-cyan-100 dark:border-cyan-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-900 via-sky-800 to-blue-900 dark:from-cyan-100 dark:via-sky-100 dark:to-blue-100 bg-clip-text text-transparent">
                Changelog
              </h1>
              <p className="text-cyan-700 dark:text-cyan-300 mt-1">
                Track new features, improvements, and bug fixes
              </p>
            </div>
          </div>
          <Button variant="outline" className="shadow-md" asChild>
            <a href="https://github.com/your-org/ai-os-platform/releases" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              GitHub Releases
            </a>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All
              </Button>
              <Button
                variant={selectedType === "feature" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("feature")}
                className="whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Features
              </Button>
              <Button
                variant={selectedType === "improvement" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("improvement")}
                className="whitespace-nowrap"
              >
                <Zap className="h-4 w-4 mr-1" />
                Improvements
              </Button>
              <Button
                variant={selectedType === "bugfix" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("bugfix")}
                className="whitespace-nowrap"
              >
                <Bug className="h-4 w-4 mr-1" />
                Bug Fixes
              </Button>
              <Button
                variant={selectedType === "security" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("security")}
                className="whitespace-nowrap"
              >
                <Shield className="h-4 w-4 mr-1" />
                Security
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Entries */}
      <div className="space-y-6">
        {filteredChangelog.map((entry) => {
          const TypeIcon = getTypeIcon(entry.type);
          return (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700 font-mono">
                          <Tag className="h-3 w-3 mr-1" />
                          v{entry.version}
                        </Badge>
                        {getTypeBadge(entry.type)}
                      </div>
                      <CardTitle className="mb-2">{entry.title}</CardTitle>
                      <CardDescription>{entry.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(entry.date), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {entry.breaking_changes && entry.breaking_changes.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Breaking Changes
                        </h4>
                        <ul className="space-y-1">
                          {entry.breaking_changes.map((change, index) => (
                            <li key={index} className="text-sm text-red-800 dark:text-red-200">
                              • {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {entry.changes.map((changeGroup, groupIndex) => (
                    <div key={groupIndex}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        {changeGroup.category}
                      </h4>
                      <ul className="space-y-2 ml-6">
                        {changeGroup.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-cyan-600 dark:text-cyan-400 mt-1.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredChangelog.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No updates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscribe to Updates */}
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
        <CardContent className="p-8 text-center">
          <Rocket className="h-12 w-12 mx-auto mb-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
          <p className="text-muted-foreground mb-6">
            Subscribe to our newsletter to get notified about new features and updates
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              Subscribe to Newsletter
            </Button>
            <Button variant="outline" asChild>
              <a href="https://twitter.com/aios_platform" target="_blank" rel="noopener noreferrer">
                Follow on Twitter
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
