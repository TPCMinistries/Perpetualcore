"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuditLogExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuditLogExportDialog({
  open,
  onOpenChange,
}: AuditLogExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const body: Record<string, unknown> = { format };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (actionFilter) body.filters = { event_category: actionFilter };

      const response = await fetch("/api/audit-logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-violet-600" />
            Export Audit Logs
          </DialogTitle>
          <DialogDescription>
            Download audit logs in CSV or JSON format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "json")}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Structured)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <Label htmlFor="actionFilter">Category Filter (optional)</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="data_modification">Data Modification</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
