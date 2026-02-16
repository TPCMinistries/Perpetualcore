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
  username?: string;
}

export default function TrelloSettingsPage() {
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
      const res = await fetch("/api/skills/trello/oauth");
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
      const res = await fetch("/api/skills/trello/oauth", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate Trello connection");
      }
    } catch {
      toast.error("Failed to connect to Trello");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/skills/trello/oauth", { method: "DELETE" });
      if (res.ok) {
        toast.success("Trello disconnected");
        setStatus({ connected: false });
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect Trello");
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
          <h1 className="text-2xl font-bold">Trello Integration</h1>
          <p className="text-muted-foreground text-sm">
            Connect Trello to manage boards, lists, cards, labels, and checklists
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
                {status.username && (
                  <p>
                    Account: <span className="font-medium">{status.username}</span>
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unplug className="h-4 w-4 mr-2" />
                {disconnecting ? "Disconnecting..." : "Disconnect Trello"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={connecting}>
              <Plug className="h-4 w-4 mr-2" />
              {connecting ? "Connecting..." : "Connect Trello"}
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
            <li><strong>list_boards</strong> — List all accessible boards</li>
            <li><strong>get_board</strong> — Get board details with lists</li>
            <li><strong>list_cards</strong> — List cards with search and list filters</li>
            <li><strong>create_card</strong> — Create cards with labels, members, due dates</li>
            <li><strong>move_card</strong> — Move cards between lists</li>
            <li><strong>add_comment</strong> — Comment on cards</li>
            <li><strong>create_list</strong> — Create new lists on boards</li>
            <li><strong>manage_labels</strong> — Create, update, or list labels</li>
            <li><strong>add_checklist</strong> — Add checklists with items to cards</li>
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
              href="https://trello.com/power-ups/admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Trello Power-Up Admin
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
