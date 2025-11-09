"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Download, Edit, Share2, FileText } from "lucide-react";
import { toast } from "sonner";

interface DocumentAccess {
  id: string;
  document_id: string;
  user_id: string;
  access_type: "view" | "download" | "edit" | "share";
  accessed_at: string;
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  document_title?: string;
}

interface DocumentAccessTableProps {
  documentId?: string;
  limit?: number;
}

export default function DocumentAccessTable({ documentId, limit = 20 }: DocumentAccessTableProps) {
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState<DocumentAccess[]>([]);

  useEffect(() => {
    // Note: This component expects a document access logs API endpoint
    // which would need to be created separately
    loadAccessLogs();
  }, [documentId]);

  async function loadAccessLogs() {
    try {
      // Placeholder - actual API endpoint would need to be implemented
      // const url = documentId
      //   ? `/api/documents/${documentId}/access?limit=${limit}`
      //   : `/api/team/document-access?limit=${limit}`;
      // const response = await fetch(url);
      // if (!response.ok) throw new Error("Failed to load access logs");
      // const data = await response.json();
      // setAccessLogs(data.logs || []);

      // For now, set empty array
      setAccessLogs([]);
    } catch (error) {
      console.error("Error loading access logs:", error);
      toast.error("Failed to load document access logs");
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getAccessIcon(type: string) {
    const iconMap: Record<string, any> = {
      view: Eye,
      download: Download,
      edit: Edit,
      share: Share2,
    };
    const Icon = iconMap[type] || Eye;
    return <Icon className="h-4 w-4" />;
  }

  function getAccessColor(type: string) {
    const colorMap: Record<string, string> = {
      view: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      download: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      edit: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      share: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    };
    return colorMap[type] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Access Logs</CardTitle>
        <CardDescription>
          {documentId ? "Access history for this document" : "Recent document access across your team"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accessLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No access logs yet</h3>
            <p className="text-sm text-muted-foreground">
              Document access activity will appear here
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  {!documentId && <TableHead>Document</TableHead>}
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs">
                            {getInitials(log.user.full_name || log.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {log.user.full_name || log.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {!documentId && (
                      <TableCell>
                        <p className="text-sm truncate max-w-xs">
                          {log.document_title || "Untitled"}
                        </p>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className={getAccessColor(log.access_type)}>
                        <span className="flex items-center gap-1">
                          {getAccessIcon(log.access_type)}
                          {log.access_type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(log.accessed_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
