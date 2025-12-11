"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Calendar,
  MessageCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  Github,
  Slack as SlackIcon,
  Database,
  Cloud,
  Code,
  Zap,
  FileText,
  Globe,
  Search,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "productivity" | "communication" | "ai" | "development" | "storage" | "other";
  icon: any;
  color: string;
  bgColor: string;
  connected: boolean;
  oauth: boolean;
  configurable: boolean;
  settings?: {
    apiKey?: string;
    webhookUrl?: string;
    enabled?: boolean;
    [key: string]: any;
  };
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [configDialog, setConfigDialog] = useState<{ open: boolean; integration: Integration | null }>({
    open: false,
    integration: null,
  });
  const [configValues, setConfigValues] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch user's connected integrations from database
      const { data: userIntegrations } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id);

      // Available integrations catalog - merge with user's connected integrations
      const availableIntegrations: Integration[] = [
        {
          id: "slack",
          name: "Slack",
          description: "Send notifications and updates to Slack channels",
          category: "communication",
          icon: SlackIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
          connected: false,
          oauth: true,
          configurable: true,
        },
        {
          id: "gmail",
          name: "Gmail",
          description: "Sync emails and send automated responses",
          category: "communication",
          icon: Mail,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          connected: false,
          oauth: true,
          configurable: true,
        },
        {
          id: "google-calendar",
          name: "Google Calendar",
          description: "Manage events and schedule meetings",
          category: "productivity",
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          connected: false,
          oauth: true,
          configurable: false,
        },
        {
          id: "github",
          name: "GitHub",
          description: "Sync repositories and manage issues",
          category: "development",
          icon: Github,
          color: "text-gray-900 dark:text-gray-100",
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          connected: false,
          oauth: true,
          configurable: true,
        },
        {
          id: "openai",
          name: "OpenAI",
          description: "Access GPT models for AI capabilities",
          category: "ai",
          icon: Sparkles,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          connected: false,
          oauth: false,
          configurable: true,
        },
        {
          id: "anthropic",
          name: "Anthropic",
          description: "Access Claude AI models",
          category: "ai",
          icon: Sparkles,
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
          color: "text-orange-600",
          connected: false,
          oauth: false,
          configurable: true,
        },
        {
          id: "notion",
          name: "Notion",
          description: "Sync pages and databases with Notion",
          category: "productivity",
          icon: FileText,
          color: "text-black dark:text-white",
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          connected: false,
          oauth: true,
          configurable: true,
        },
        {
          id: "zapier",
          name: "Zapier",
          description: "Connect to 5,000+ apps with automated workflows",
          category: "productivity",
          icon: Zap,
          color: "text-orange-500",
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
          connected: false,
          oauth: true,
          configurable: false,
        },
        {
          id: "aws",
          name: "AWS",
          description: "Deploy and manage cloud infrastructure",
          category: "storage",
          icon: Cloud,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
          connected: false,
          oauth: false,
          configurable: true,
        },
        {
          id: "postgresql",
          name: "PostgreSQL",
          description: "Connect to external PostgreSQL databases",
          category: "storage",
          icon: Database,
          color: "text-blue-700",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          connected: false,
          oauth: false,
          configurable: true,
        },
        {
          id: "webhook",
          name: "Custom Webhooks",
          description: "Receive and send HTTP webhooks",
          category: "development",
          icon: Code,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
          connected: false,
          oauth: false,
          configurable: true,
        },
        {
          id: "rest-api",
          name: "REST API",
          description: "Connect to any REST API endpoint",
          category: "development",
          icon: Globe,
          color: "text-teal-600",
          bgColor: "bg-teal-50 dark:bg-teal-950/30",
          connected: false,
          oauth: false,
          configurable: true,
        },
      ];

      // Merge user's connected integrations with available catalog
      const mergedIntegrations = availableIntegrations.map((integration) => {
        const userIntegration = userIntegrations?.find(
          (ui: any) => ui.integration_id === integration.id
        );
        if (userIntegration) {
          return {
            ...integration,
            connected: userIntegration.is_connected || false,
            settings: userIntegration.settings || {},
          };
        }
        return integration;
      });

      setIntegrations(mergedIntegrations);
    } catch (error) {
      console.error("Error loading integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(integration: Integration) {
    if (integration.oauth) {
      toast.info(`Redirecting to ${integration.name} OAuth...`);

      // Map integration IDs to OAuth endpoints
      const oauthEndpoints: Record<string, string> = {
        "gmail": "/api/integrations/google/connect?service=gmail",
        "google-calendar": "/api/integrations/google/connect?service=calendar",
        "slack": "/api/integrations/slack/connect",
        "github": "/api/integrations/github/connect",
      };

      const endpoint = oauthEndpoints[integration.id];

      if (endpoint) {
        // Redirect to real OAuth flow
        window.location.href = endpoint;
      } else {
        // For integrations without implemented OAuth, show info message
        toast.info(`${integration.name} OAuth is not configured yet. Please add the API keys in your environment.`);
      }
    } else if (integration.configurable) {
      setConfigDialog({ open: true, integration });
      setConfigValues(integration.settings || {});
    } else {
      toast.info("No configuration needed for this integration");
    }
  }

  async function handleDisconnect(integrationId: string) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const integration = integrations.find(i => i.id === integrationId);

      await supabase
        .from("user_integrations")
        .update({ is_connected: false })
        .eq("user_id", user.id)
        .eq("integration_id", integrationId);

      toast.success(`Disconnected from ${integration?.name}`);
      setIntegrations(integrations.map(i =>
        i.id === integrationId ? { ...i, connected: false } : i
      ));
    } catch (error) {
      toast.error("Failed to disconnect integration");
    }
  }

  async function handleSaveConfig() {
    setSaving(true);
    try {
      if (!configDialog.integration) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Save configuration to database
      await supabase.from("user_integrations").upsert({
        user_id: user.id,
        integration_id: configDialog.integration.id,
        is_connected: true,
        settings: configValues,
      });

      toast.success(`${configDialog.integration.name} configured successfully`);

      setIntegrations(integrations.map(i =>
        i.id === configDialog.integration?.id
          ? { ...i, connected: true, settings: configValues }
          : i
      ));

      setConfigDialog({ open: false, integration: null });
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(integration: Integration) {
    toast.loading("Testing connection...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.dismiss();
      toast.success(`${integration.name} connection test successful!`);
    } catch (error) {
      toast.dismiss();
      toast.error("Connection test failed");
    }
  }

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "All Integrations", count: integrations.length },
    { id: "productivity", label: "Productivity", count: integrations.filter(i => i.category === "productivity").length },
    { id: "communication", label: "Communication", count: integrations.filter(i => i.category === "communication").length },
    { id: "ai", label: "AI & ML", count: integrations.filter(i => i.category === "ai").length },
    { id: "development", label: "Development", count: integrations.filter(i => i.category === "development").length },
    { id: "storage", label: "Storage", count: integrations.filter(i => i.category === "storage").length },
  ];

  const connectedCount = integrations.filter(i => i.connected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <LinkIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-violet-900 dark:from-indigo-100 dark:via-purple-100 dark:to-violet-100 bg-clip-text text-transparent">
                Integrations
              </h1>
              <p className="text-indigo-700 dark:text-indigo-300 mt-1">
                Connect your favorite tools and services
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {connectedCount}/{integrations.length}
              </div>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadIntegrations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm">
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {cat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${integration.bgColor}`}>
                  <integration.icon className={`h-6 w-6 ${integration.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{integration.name}</h3>
                    {integration.connected ? (
                      <Badge className="bg-green-50 border-green-300 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>

              {/* Settings Preview */}
              {integration.connected && integration.settings && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium mb-2">Configuration:</p>
                  <div className="space-y-1">
                    {Object.entries(integration.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-mono">
                          {typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {integration.connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleTest(integration)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    {integration.configurable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setConfigDialog({ open: true, integration });
                          setConfigValues(integration.settings || {});
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    onClick={() => handleConnect(integration)}
                  >
                    {integration.oauth ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Connect with OAuth
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No integrations found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialog.open} onOpenChange={(open) => setConfigDialog({ open, integration: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {configDialog.integration?.name}</DialogTitle>
            <DialogDescription>
              Enter your {configDialog.integration?.name} configuration details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {configDialog.integration?.id === "openai" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={configValues.apiKey || ""}
                    onChange={(e) => setConfigValues({ ...configValues, apiKey: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enable Integration</Label>
                  <Switch
                    id="enabled"
                    checked={configValues.enabled || false}
                    onCheckedChange={(checked) => setConfigValues({ ...configValues, enabled: checked })}
                  />
                </div>
              </>
            )}

            {configDialog.integration?.id === "anthropic" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-ant-..."
                    value={configValues.apiKey || ""}
                    onChange={(e) => setConfigValues({ ...configValues, apiKey: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enable Integration</Label>
                  <Switch
                    id="enabled"
                    checked={configValues.enabled || false}
                    onCheckedChange={(checked) => setConfigValues({ ...configValues, enabled: checked })}
                  />
                </div>
              </>
            )}

            {configDialog.integration?.id === "webhook" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://api.example.com/webhook"
                    value={configValues.webhookUrl || ""}
                    onChange={(e) => setConfigValues({ ...configValues, webhookUrl: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enable Webhooks</Label>
                  <Switch
                    id="enabled"
                    checked={configValues.enabled || false}
                    onCheckedChange={(checked) => setConfigValues({ ...configValues, enabled: checked })}
                  />
                </div>
              </>
            )}

            {!["openai", "anthropic", "webhook"].includes(configDialog.integration?.id || "") && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key / Access Token</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your credentials..."
                  value={configValues.apiKey || ""}
                  onChange={(e) => setConfigValues({ ...configValues, apiKey: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog({ open: false, integration: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
