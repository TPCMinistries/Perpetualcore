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
  login?: string;
}

export default function GitHubSettingsPage() {
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
      const res = await fetch("/api/skills/github/oauth");
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
      const res = await fetch("/api/skills/github/oauth", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate GitHub connection");
      }
    } catch {
      toast.error("Failed to connect to GitHub");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/skills/github/oauth", { method: "DELETE" });
      if (res.ok) {
        toast.success("GitHub disconnected");
        setStatus({ connected: false });
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect GitHub");
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
          <h1 className="text-2xl font-bold">GitHub Integration</h1>
          <p className="text-muted-foreground text-sm">
            Connect GitHub to manage repos, issues, PRs, files, and Actions
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
                {status.login && (
                  <p>
                    Account: <span className="font-medium">@{status.login}</span>
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unplug className="h-4 w-4 mr-2" />
                {disconnecting ? "Disconnecting..." : "Disconnect GitHub"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={connecting}>
              <Plug className="h-4 w-4 mr-2" />
              {connecting ? "Connecting..." : "Connect GitHub"}
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
            <li><strong>search_repos</strong> — Search repositories</li>
            <li><strong>create_issue</strong> — Create issues with labels and assignees</li>
            <li><strong>list_issues</strong> — List and filter issues</li>
            <li><strong>create_pr</strong> — Create pull requests</li>
            <li><strong>review_pr</strong> — Approve, request changes, or comment on PRs</li>
            <li><strong>get_file</strong> — Read file contents from repos</li>
            <li><strong>create_file</strong> — Create or update files with commits</li>
            <li><strong>list_commits</strong> — View commit history</li>
            <li><strong>search_code</strong> — Search code across repositories</li>
            <li><strong>list_workflows</strong> — View GitHub Actions workflows</li>
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
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              GitHub Personal Access Tokens
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
