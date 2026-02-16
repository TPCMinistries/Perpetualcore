"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Unplug, Plug } from "lucide-react";
import { toast } from "sonner";

interface ConnectionStatus {
  connected: boolean;
  source?: "user" | "organization" | "system";
  workspace?: string;
}

export default function NotionSettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/skills/notion/oauth");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/skills/notion/oauth", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate Notion connection");
      }
    } catch {
      toast.error("Failed to connect to Notion");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/skills/notion/oauth", { method: "DELETE" });
      if (res.ok) {
        toast.success("Notion disconnected");
        setStatus({ connected: false });
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect Notion");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/settings/skills")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Notion Integration</h1>
          <p className="text-muted-foreground text-sm">
            Connect your Notion workspace to search, create, and manage pages and databases
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection Status</span>
            {!loading && (
              <Badge variant={status?.connected ? "default" : "secondary"}>
                {status?.connected ? "Connected" : "Not Connected"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="animate-pulse h-10 bg-muted rounded" />
          ) : status?.connected ? (
            <>
              <div className="text-sm text-muted-foreground">
                <p>
                  Source: <span className="font-medium capitalize">{status.source}</span>
                </p>
                {status.workspace && (
                  <p>
                    Workspace: <span className="font-medium">{status.workspace}</span>
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unplug className="h-4 w-4 mr-2" />
                {disconnecting ? "Disconnecting..." : "Disconnect Notion"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={connecting}>
              <Plug className="h-4 w-4 mr-2" />
              {connecting ? "Connecting..." : "Connect Notion"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li><strong>search_pages</strong> — Search pages by title or content</li>
            <li><strong>create_page</strong> — Create a new page under a parent</li>
            <li><strong>update_page</strong> — Update page properties</li>
            <li><strong>query_database</strong> — Query databases with filters and sorts</li>
            <li><strong>create_database</strong> — Create new databases</li>
            <li><strong>add_block</strong> — Append blocks to pages</li>
            <li><strong>get_page</strong> — Get full page content and properties</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Notion Integrations Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
