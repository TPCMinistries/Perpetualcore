"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  FileSpreadsheet,
  Link2,
  Unlink,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

interface SheetInfo {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

interface GoogleSheetsConnectProps {
  onImport?: (data: any[]) => void;
  exportData?: {
    title: string;
    headers: string[];
    rows: any[][];
  };
}

export function GoogleSheetsConnect({ onImport, exportData }: GoogleSheetsConnectProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetTable, setTargetTable] = useState("contacts");

  // Available import targets
  const importTargets = [
    { value: "contacts", label: "Contacts" },
    { value: "tasks", label: "Tasks" },
    { value: "projects", label: "Projects" },
    { value: "leads", label: "Leads" },
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/integrations/google-sheets?action=status");
      const data = await response.json();
      setConnected(data.connected);
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await fetch(
        `/api/integrations/google-sheets?action=auth_url&returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("Failed to get auth URL");
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast.error("Failed to start connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });

      setConnected(false);
      setSpreadsheets([]);
      toast.success("Google Sheets disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect");
    }
  };

  const loadSpreadsheets = async () => {
    try {
      const response = await fetch("/api/integrations/google-sheets?action=list");
      const data = await response.json();
      setSpreadsheets(data.spreadsheets || []);
    } catch (error) {
      console.error("Failed to load spreadsheets:", error);
      toast.error("Failed to load spreadsheets");
    }
  };

  const loadSheets = async (spreadsheetId: string) => {
    try {
      const response = await fetch(
        `/api/integrations/google-sheets?action=info&spreadsheetId=${spreadsheetId}`
      );
      const data = await response.json();
      setSheets(data.sheets || []);
      if (data.sheets?.length > 0) {
        setSelectedSheet(data.sheets[0].title);
      }
    } catch (error) {
      console.error("Failed to load sheets:", error);
    }
  };

  const handleImport = async () => {
    if (!selectedSpreadsheet || !selectedSheet) {
      toast.error("Please select a spreadsheet and sheet");
      return;
    }

    try {
      setImporting(true);
      const response = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import",
          spreadsheetId: selectedSpreadsheet.id,
          sheetName: selectedSheet,
          targetTable,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      toast.success(`Imported ${data.imported} records`);
      setImportDialogOpen(false);

      if (onImport) {
        onImport(data.records);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    if (!exportData) {
      toast.error("No data to export");
      return;
    }

    try {
      setExporting(true);
      const response = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          title: exportData.title,
          headers: exportData.headers,
          rows: exportData.rows,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      toast.success("Exported to Google Sheets");
      setExportDialogOpen(false);

      // Open the new spreadsheet
      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, "_blank");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Export failed: ${error}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Sheet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base">Google Sheets</CardTitle>
              <CardDescription>Import and export data to Google Sheets</CardDescription>
            </div>
          </div>
          {connected && (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!connected ? (
          <Button onClick={handleConnect} disabled={connecting}>
            <Link2 className="h-4 w-4 mr-2" />
            {connecting ? "Connecting..." : "Connect Google Sheets"}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Import Button */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadSpreadsheets();
                    setImportDialogOpen(true);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Import from Google Sheets</DialogTitle>
                  <DialogDescription>
                    Select a spreadsheet and sheet to import data from
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Spreadsheet</Label>
                    <Select
                      value={selectedSpreadsheet?.id || ""}
                      onValueChange={(id) => {
                        const sheet = spreadsheets.find((s) => s.id === id);
                        setSelectedSpreadsheet(sheet || null);
                        if (sheet) loadSheets(sheet.id);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a spreadsheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {spreadsheets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {sheets.length > 0 && (
                    <div className="space-y-2">
                      <Label>Sheet</Label>
                      <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sheet" />
                        </SelectTrigger>
                        <SelectContent>
                          {sheets.map((s) => (
                            <SelectItem key={s.sheetId} value={s.title}>
                              {s.title} ({s.rowCount} rows)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Import to</Label>
                    <Select value={targetTable} onValueChange={setTargetTable}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {importTargets.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importing || !selectedSpreadsheet || !selectedSheet}
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Button */}
            {exportData && (
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export to Google Sheets</DialogTitle>
                    <DialogDescription>
                      Create a new Google Sheet with your data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="font-medium">{exportData.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exportData.headers.length} columns, {exportData.rows.length} rows
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleExport} disabled={exporting}>
                        {exporting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Export to Sheets
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Disconnect Button */}
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
