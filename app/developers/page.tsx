"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  BarChart3,
  Code,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<any>(null);

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/developers/keys");
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.keys || []);
      } else {
        toast.error("Failed to load API keys");
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const usageStats = {
    current_period: {
      calls: 54170,
      limit: 100000,
      cost: 162.51,
      period: "January 2025",
    },
    by_endpoint: [
      { name: "/v1/chat/completions", calls: 32400, percentage: 59.8 },
      { name: "/v1/embeddings", calls: 15200, percentage: 28.1 },
      { name: "/v1/agents/run", calls: 6570, percentage: 12.1 },
    ],
    by_model: [
      { name: "GPT-4 Turbo", calls: 12300, cost: 98.4 },
      { name: "Claude 3 Sonnet", calls: 28900, cost: 52.02 },
      { name: "GPT-3.5 Turbo", calls: 12970, cost: 12.09 },
    ],
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleCreateKey = async () => {
    const keyName = prompt("Enter a name for your API key:");
    if (!keyName) return;

    const environment = confirm("Is this for production? (Cancel for development)")
      ? "production"
      : "development";

    setIsCreatingKey(true);

    try {
      const response = await fetch("/api/developers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName, environment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create API key");
      }

      // Show the new key in a dialog (only shown once!)
      setNewKeyData(data);
      setShowNewKeyDialog(true);

      // Refresh the keys list
      await fetchApiKeys();

      toast.success("API key created successfully!");
    } catch (error: any) {
      console.error("Error creating API key:", error);
      toast.error(error.message || "Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/developers/keys?key_id=${keyId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke API key");
      }

      toast.success("API key revoked successfully");
      await fetchApiKeys();
    } catch (error: any) {
      console.error("Error revoking API key:", error);
      toast.error(error.message || "Failed to revoke API key");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Developer Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs/api" className="text-sm font-medium hover:underline">
              API Docs
            </Link>
            <Link href="/api-pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats.current_period.calls.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {((usageStats.current_period.calls / usageStats.current_period.limit) * 100).toFixed(1)}% of limit
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${(usageStats.current_period.calls / usageStats.current_period.limit) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Usage Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${usageStats.current_period.cost}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {usageStats.current_period.period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Production & development
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pro</div>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/api-pricing">Upgrade Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Start building with the Perpetual Core API in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create an API Key</div>
                    <div className="text-sm text-muted-foreground">
                      Generate a new API key from the "API Keys" tab
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Make Your First Request</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Use the API key to make requests to our endpoints
                    </div>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>{`curl https://api.aios.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Monitor Usage</div>
                    <div className="text-sm text-muted-foreground">
                      Track your API usage and costs in real-time from the dashboard
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button asChild>
                    <Link href="/docs/api">
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Documentation
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/docs/quickstart">
                      <Code className="mr-2 h-4 w-4" />
                      Quickstart Guide
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Endpoints</CardTitle>
                <CardDescription>Most used API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.by_endpoint.map((endpoint) => (
                    <div key={endpoint.name}>
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono">{endpoint.name}</code>
                        <span className="text-sm text-muted-foreground">
                          {endpoint.calls.toLocaleString()} calls ({endpoint.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${endpoint.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">API Keys</h2>
                <p className="text-muted-foreground">
                  Manage your API keys for accessing the Perpetual Core API
                </p>
              </div>
              <Button onClick={handleCreateKey} disabled={isCreatingKey}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingKey ? "Creating..." : "Create New Key"}
              </Button>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-amber-900 dark:text-amber-100">
                      Keep your API keys secure
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      Never share your API keys or commit them to public repositories.
                      Use environment variables to store keys in your applications.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading API keys...</p>
                </CardContent>
              </Card>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first API key to start using the Perpetual Core API
                  </p>
                  <Button onClick={handleCreateKey} disabled={isCreatingKey}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {apiKey.name}
                            <Badge variant="secondary" className="text-xs capitalize">
                              {apiKey.environment}
                            </Badge>
                            {apiKey.status === "revoked" && (
                              <Badge variant="destructive" className="text-xs">
                                Revoked
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Created {new Date(apiKey.created_at).toLocaleDateString()}
                            {apiKey.last_used_at && (
                              <> • Last used {new Date(apiKey.last_used_at).toLocaleDateString()}</>
                            )}
                          </CardDescription>
                        </div>
                        {apiKey.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>API Key Prefix</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="text"
                            value={`${apiKey.key_prefix}••••••••••••••••`}
                            readOnly
                            className="font-mono text-sm"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Full key was only shown once at creation
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Total Requests</span>
                          <span className="text-sm text-muted-foreground">
                            {apiKey.total_requests?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rate limit: {apiKey.rate_limit_per_minute} req/min, {apiKey.rate_limit_per_day} req/day
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Model</CardTitle>
                <CardDescription>
                  API calls and costs broken down by AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.by_model.map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.calls.toLocaleString()} calls
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${model.cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          ${(model.cost / model.calls).toFixed(4)}/call
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Summary</CardTitle>
                <CardDescription>
                  Current billing period: {usageStats.current_period.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base subscription:</span>
                    <span className="font-medium">$99.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usage charges:</span>
                    <span className="font-medium">${usageStats.current_period.cost}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Total this month:</span>
                      <span className="text-xl font-bold">
                        ${(99 + usageStats.current_period.cost).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline" asChild>
                  <Link href="/dashboard/settings/billing">View Billing Details</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>
                  Learn how to integrate the Perpetual Core API into your applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/docs/api">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Complete API Reference
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/docs/quickstart">
                    <Code className="mr-2 h-4 w-4" />
                    Quickstart Guide
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/docs/examples">
                    <Code className="mr-2 h-4 w-4" />
                    Code Examples
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New API Key Dialog */}
      {showNewKeyDialog && newKeyData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle>API Key Created Successfully!</CardTitle>
              <CardDescription>
                Save this key securely. You won't be able to see it again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Important: Copy your API key now
                    </div>
                    <div className="text-amber-800 dark:text-amber-200">
                      {newKeyData.warning}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Your API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    value={newKeyData.api_key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      copyToClipboard(newKeyData.api_key);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{newKeyData.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Environment:</span>
                  <div className="font-medium capitalize">{newKeyData.environment}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate Limit:</span>
                  <div className="font-medium">
                    {newKeyData.rate_limits.per_minute} req/min
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <div className="font-medium">
                    {newKeyData.rate_limits.per_day} req/day
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowNewKeyDialog(false);
                    setNewKeyData(null);
                  }}
                >
                  I've Saved My Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
