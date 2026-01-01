"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, Settings, AlertCircle, FileSpreadsheet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { GoogleSheetsConnect } from "@/components/integrations/GoogleSheetsConnect";

interface IntegrationConfig {
  provider: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  scopes: string[];
  configured: boolean;
  connected: boolean;
}

interface Integration {
  id: string;
  provider: string;
  provider_user_id: string | null;
  provider_team_id: string | null;
  is_active: boolean;
  metadata: any;
  last_synced_at: string | null;
  created_at: string;
  config: IntegrationConfig;
  configured: boolean;
}

export default function IntegrationsPage() {
  const [available, setAvailable] = useState<IntegrationConfig[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();

    // Check for OAuth callback results
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success) {
      toast.success(`Integration connected successfully!`);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Failed to connect: ${error.replace("_", " ")}`);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function fetchIntegrations() {
    try {
      const response = await fetch("/api/integrations");
      if (!response.ok) throw new Error("Failed to fetch integrations");

      const data = await response.json();
      setAvailable(data.available || []);
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(provider: string) {
    setConnecting(provider);

    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initiate OAuth");
      }

      const { authUrl } = await response.json();

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Error connecting integration:", error);
      toast.error(error.message || "Failed to connect integration");
      setConnecting(null);
    }
  }

  async function handleDisconnect(integrationId: string, providerName: string) {
    if (!confirm(`Are you sure you want to disconnect ${providerName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      toast.success(`${providerName} disconnected`);
      fetchIntegrations();
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      toast.error("Failed to disconnect integration");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and services
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border border-sky-100 dark:border-sky-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-900 via-blue-800 to-indigo-900 dark:from-sky-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">Integrations</h1>
            <p className="text-sky-700 dark:text-sky-300 mt-1">
              Connect your favorite tools and services to automate workflows
            </p>
          </div>
        </div>
      </div>

      {/* Spreadsheet Integrations */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Spreadsheet Integrations</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Import and export data to/from spreadsheet applications
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <GoogleSheetsConnect />
        </div>
      </div>

      {/* Popular Integrations - Quick Connect */}
      {available.filter(i => i.configured).length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Popular Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Connect your most-used tools in seconds
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {available
              .filter(i => i.configured && ['google', 'slack', 'notion', 'zoom', 'google_drive', 'microsoft'].includes(i.provider))
              .slice(0, 6)
              .map((integration) => {
                const connectedIntegration = integrations.find(
                  (i) => i.provider === integration.provider && i.is_active
                );
                return (
                  <Card key={integration.provider} className="hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`text-3xl flex items-center justify-center w-12 h-12 rounded-lg ${integration.color}`}>
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">⏱️ 30 seconds</p>
                        </div>
                      </div>
                      {connectedIntegration ? (
                        <Badge variant="outline" className="w-full justify-center bg-green-50 border-green-300 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleConnect(integration.provider)}
                          disabled={connecting === integration.provider}
                        >
                          {connecting === integration.provider ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Setup Help Notice */}
      {available.some((i) => !i.configured) && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Need Help Setting Up?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Some integrations are not yet available. Your administrator can enable them by configuring the app settings.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Available soon:</strong>{" "}
              {available
                .filter((i) => !i.configured)
                .map((i) => i.name)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Integrations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {available.map((integration) => {
          const connectedIntegration = integrations.find(
            (i) => i.provider === integration.provider && i.is_active
          );

          return (
            <Card
              key={integration.provider}
              className={connectedIntegration ? "border-green-200" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-3xl flex items-center justify-center w-12 h-12 rounded-lg ${integration.color}`}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {connectedIntegration && (
                        <Badge variant="outline" className="mt-1 text-xs bg-green-50 border-green-300 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {!integration.configured && (
                        <Badge variant="outline" className="mt-1 text-xs bg-gray-50 border-gray-300 text-gray-700">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectedIntegration ? (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {connectedIntegration.metadata?.team_name && (
                        <p>Team: {connectedIntegration.metadata.team_name}</p>
                      )}
                      {connectedIntegration.metadata?.user_name && (
                        <p>User: {connectedIntegration.metadata.user_name}</p>
                      )}
                      <p>
                        Connected:{" "}
                        {new Date(connectedIntegration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          handleDisconnect(connectedIntegration.id, integration.name)
                        }
                      >
                        <X className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(integration.provider)}
                      disabled={!integration.configured || connecting === integration.provider}
                    >
                      {connecting === integration.provider ? (
                        "Connecting..."
                      ) : !integration.configured ? (
                        "Coming Soon"
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                    {integration.configured && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        ⏱️ Takes ~30 seconds
                      </p>
                    )}
                  </>
                )}

                {/* What you'll get */}
                {integration.scopes.length > 0 && !connectedIntegration && integration.configured && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">What you'll be able to do:</p>
                    <div className="space-y-1">
                      {integration.scopes.slice(0, 2).map((scope, idx) => (
                        <div key={idx} className="text-xs flex items-start gap-1">
                          <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{scope.split(":")[0] || scope.split("/").pop()}</span>
                        </div>
                      ))}
                      {integration.scopes.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{integration.scopes.length - 2} more capabilities
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {available.length === 0 && (
        <EmptyState
          icon={Settings}
          title="No integrations available"
          description="Integration features are being set up. Check back soon!"
        />
      )}
    </div>
  );
}
