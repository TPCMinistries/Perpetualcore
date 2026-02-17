"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Monitor, Smartphone, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActiveSession {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  login_at: string;
  last_active_at: string;
  provider: string | null;
}

interface SessionTableProps {
  sessions: ActiveSession[];
  onForceLogout: (sessionId: string) => Promise<void>;
}

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Globe className="h-4 w-4 text-gray-400" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return <Smartphone className="h-4 w-4 text-gray-500" />;
  }
  return <Monitor className="h-4 w-4 text-gray-500" />;
}

function getBrowserName(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edg")) return "Edge";
  return "Other";
}

export default function SessionTable({ sessions, onForceLogout }: SessionTableProps) {
  const [loggingOut, setLoggingOut] = useState<string | null>(null);

  async function handleForceLogout(sessionId: string) {
    setLoggingOut(sessionId);
    try {
      await onForceLogout(sessionId);
    } finally {
      setLoggingOut(null);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No active sessions found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium text-gray-600">User</th>
            <th className="pb-2 font-medium text-gray-600">Device</th>
            <th className="pb-2 font-medium text-gray-600">IP Address</th>
            <th className="pb-2 font-medium text-gray-600">Provider</th>
            <th className="pb-2 font-medium text-gray-600">Last Active</th>
            <th className="pb-2 font-medium text-gray-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b last:border-0">
              <td className="py-3">
                <div className="font-medium">{session.user_name || "Unknown"}</div>
                <div className="text-xs text-gray-500">{session.user_email}</div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  {getDeviceIcon(session.user_agent)}
                  <span>{getBrowserName(session.user_agent)}</span>
                </div>
              </td>
              <td className="py-3">
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {session.ip_address || "N/A"}
                </code>
              </td>
              <td className="py-3">
                <Badge variant="outline" className="text-xs">
                  {session.provider || "password"}
                </Badge>
              </td>
              <td className="py-3 text-gray-500">
                {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
              </td>
              <td className="py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleForceLogout(session.id)}
                  disabled={loggingOut === session.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  {loggingOut === session.id ? "Logging out..." : "Force Logout"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
