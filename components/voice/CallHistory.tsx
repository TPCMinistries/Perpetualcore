"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Phone,
  Loader2,
} from "lucide-react";

interface VoiceCallEntry {
  id: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "default",
  "in-progress": "secondary",
  ringing: "secondary",
  initiated: "outline",
  failed: "destructive",
  busy: "destructive",
  "no-answer": "destructive",
  canceled: "outline",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CallHistory({ limit = 10 }: { limit?: number }) {
  const [calls, setCalls] = useState<VoiceCallEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    try {
      const res = await fetch(`/api/voice/calls?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(
          (data.calls || []).map((c: any) => ({
            id: c.id,
            direction: c.direction,
            fromNumber: c.fromNumber,
            toNumber: c.toNumber,
            status: c.status,
            durationSeconds: c.durationSeconds,
            createdAt: c.createdAt,
          }))
        );
      }
    } catch {
      // Silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Recent Calls
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No calls yet
          </p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {call.direction === "inbound" ? (
                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                  ) : (
                    <PhoneOutgoing className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {call.direction === "outbound"
                        ? call.toNumber
                        : call.fromNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(call.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(call.durationSeconds)}
                  </span>
                  <Badge
                    variant={
                      (STATUS_COLORS[call.status] as any) || "secondary"
                    }
                  >
                    {call.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
