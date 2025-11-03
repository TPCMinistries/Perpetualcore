"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Archive,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ExportJob {
  id: string;
  data_types: string[];
  format: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_url: string | null;
  file_size: number | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export default function DataExportPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exports, setExports] = useState<ExportJob[]>([]);

  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([
    "profile",
    "agents",
    "workflows",
    "knowledge_base",
  ]);
  const [exportFormat, setExportFormat] = useState("json");

  const dataTypes = [
    { id: "profile", label: "Profile Information", description: "Your personal profile data" },
    { id: "agents", label: "AI Agents", description: "All your AI agents and configurations" },
    { id: "workflows", label: "Workflows", description: "Workflow definitions and executions" },
    { id: "knowledge_base", label: "Knowledge Base", description: "Documents and knowledge articles" },
    { id: "conversations", label: "Conversations", description: "Chat history and interactions" },
    { id: "analytics", label: "Analytics Data", description: "Usage statistics and metrics" },
    { id: "api_keys", label: "API Keys", description: "API key metadata (not the keys themselves)" },
    { id: "audit_logs", label: "Audit Logs", description: "Account activity and security logs" },
  ];

  useEffect(() => {
    loadExports();
  }, []);

  async function loadExports() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("data_exports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setExports(data || []);
    } catch (error) {
      console.error("Error loading exports:", error);
      toast.error("Failed to load export history");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartExport() {
    if (selectedDataTypes.length === 0) {
      toast.error("Please select at least one data type to export");
      return;
    }

    setExporting(true);
    try {
      const response = await fetch("/api/data-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_types: selectedDataTypes,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start export");
      }

      toast.success("Export started! You'll receive an email when it's ready.");
      loadExports();
    } catch (error: any) {
      console.error("Error starting export:", error);
      toast.error(error.message || "Failed to start data export");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload(exportJob: ExportJob) {
    if (!exportJob.file_url) {
      toast.error("Download URL not available");
      return;
    }

    try {
      const response = await fetch(exportJob.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-os-export-${exportJob.id}.${exportJob.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading export:", error);
      toast.error("Failed to download export");
    }
  }

  function toggleDataType(dataTypeId: string) {
    setSelectedDataTypes((prev) =>
      prev.includes(dataTypeId)
        ? prev.filter((id) => id !== dataTypeId)
        : [...prev, dataTypeId]
    );
  }

  function getStatusBadge(status: string) {
    const variants = {
      pending: { icon: Clock, className: "bg-blue-50 border-blue-300 text-blue-700" },
      processing: { icon: Loader2, className: "bg-yellow-50 border-yellow-300 text-yellow-700" },
      completed: { icon: CheckCircle2, className: "bg-green-50 border-green-300 text-green-700" },
      failed: { icon: XCircle, className: "bg-red-50 border-red-300 text-red-700" },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className={`h-3 w-3 mr-1 ${status === "processing" ? "animate-spin" : ""}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 border border-amber-100 dark:border-amber-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-900 via-orange-800 to-red-900 dark:from-amber-100 dark:via-orange-100 dark:to-red-100 bg-clip-text text-transparent">
              Data Export
            </h1>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Download a copy of your data
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                About Data Exports
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Exports are processed in the background and may take several minutes</li>
                <li>• You'll receive an email when your export is ready to download</li>
                <li>• Download links expire after 7 days for security</li>
                <li>• Exports include data created up to the time of request</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Export */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Export</CardTitle>
          <CardDescription>
            Select the data types you want to include in your export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Types Selection */}
          <div className="space-y-4">
            <Label>Data to Export</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {dataTypes.map((dataType) => (
                <div
                  key={dataType.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleDataType(dataType.id)}
                >
                  <Checkbox
                    id={dataType.id}
                    checked={selectedDataTypes.includes(dataType.id)}
                    onCheckedChange={() => toggleDataType(dataType.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={dataType.id} className="font-medium cursor-pointer">
                      {dataType.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{dataType.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON - Best for developers</SelectItem>
                <SelectItem value="csv">CSV - Best for spreadsheets</SelectItem>
                <SelectItem value="xml">XML - Structured data</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the format that works best for your use case
            </p>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={handleStartExport}
              disabled={exporting || selectedDataTypes.length === 0}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Start Export
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Selected {selectedDataTypes.length} of {dataTypes.length} data types
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Your recent data export requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No exports yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first data export to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exports.map((exportJob) => (
                <div
                  key={exportJob.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {exportJob.data_types.join(", ").substring(0, 50)}
                          {exportJob.data_types.join(", ").length > 50 ? "..." : ""}
                        </p>
                        {getStatusBadge(exportJob.status)}
                        <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700 uppercase">
                          {exportJob.format}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Created {formatDistanceToNow(new Date(exportJob.created_at), { addSuffix: true })}
                        </span>
                        {exportJob.file_size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(exportJob.file_size)}</span>
                          </>
                        )}
                        {exportJob.expires_at && exportJob.status === "completed" && (
                          <>
                            <span>•</span>
                            <span>
                              Expires {formatDistanceToNow(new Date(exportJob.expires_at), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {exportJob.status === "completed" && exportJob.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(exportJob)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {exportJob.status === "processing" && (
                      <Button variant="outline" size="sm" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing
                      </Button>
                    )}
                    {exportJob.status === "failed" && (
                      <Button variant="outline" size="sm" disabled>
                        <XCircle className="h-4 w-4 mr-2" />
                        Failed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Notice */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Data Portability</h3>
              <p className="text-sm text-muted-foreground mb-3">
                As part of our commitment to data privacy and in compliance with GDPR regulations,
                you have the right to export and transfer your data. If you need assistance or have
                questions about your data, please contact our privacy team.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:privacy@aios-platform.com">
                  Contact Privacy Team
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
