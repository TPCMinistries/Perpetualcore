"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileJson,
  FileArchive,
  FileText,
  Calendar,
  Table,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ImportExportPage() {
  const [exportFormat, setExportFormat] = useState("zip");
  const [exportLoading, setExportLoading] = useState(false);
  const [importFormat, setImportFormat] = useState("json");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/export?format=${exportFormat}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export-${Date.now()}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("format", importFormat);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        toast.success(`Import successful! Imported ${JSON.stringify(result.imported)}`);
        setSelectedFile(null);
      } else {
        toast.error(`Import completed with errors: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Import failed. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import & Export</h1>
        <p className="text-gray-600 mt-2">
          Back up your data or migrate from other services
        </p>
      </div>

      {/* Export Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download your conversations, tasks, documents, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <FileArchive className="h-4 w-4" />
                    <span>Complete Backup (ZIP)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <span>JSON Backup</span>
                  </div>
                </SelectItem>
                <SelectItem value="tasks-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Tasks (Markdown)</span>
                  </div>
                </SelectItem>
                <SelectItem value="documents-csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span>Documents List (CSV)</span>
                  </div>
                </SelectItem>
                <SelectItem value="calendar-ics">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Calendar Events (ICS)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Export Includes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {exportFormat === "zip" && (
                <>
                  <li>• All conversations in Markdown format</li>
                  <li>• Tasks with status and priorities</li>
                  <li>• Complete JSON backup for restoration</li>
                  <li>• README with import instructions</li>
                </>
              )}
              {exportFormat === "json" && (
                <>
                  <li>• All conversations and messages</li>
                  <li>• Documents metadata</li>
                  <li>• Tasks and action items</li>
                  <li>• Calendar events</li>
                  <li>• Email data</li>
                </>
              )}
              {exportFormat === "tasks-md" && (
                <>
                  <li>• All tasks grouped by status</li>
                  <li>• Task descriptions and metadata</li>
                  <li>• Checkbox format for easy viewing</li>
                </>
              )}
              {exportFormat === "documents-csv" && (
                <>
                  <li>• Document titles and file names</li>
                  <li>• File types and sizes</li>
                  <li>• Processing status and dates</li>
                </>
              )}
              {exportFormat === "calendar-ics" && (
                <>
                  <li>• All calendar events</li>
                  <li>• Meeting times and locations</li>
                  <li>• Compatible with Google Calendar, Outlook, Apple Calendar</li>
                </>
              )}
            </ul>
          </div>

          <Button
            onClick={handleExport}
            disabled={exportLoading}
            className="w-full"
            size="lg"
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Restore from backup or import from Notion, Evernote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Import Format</label>
            <Select value={importFormat} onValueChange={setImportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <span>JSON Backup</span>
                  </div>
                </SelectItem>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <FileArchive className="h-4 w-4" />
                    <span>ZIP Archive (Notion-style)</span>
                  </div>
                </SelectItem>
                <SelectItem value="evernote">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Evernote Export (ENEX)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept={
                  importFormat === "json"
                    ? ".json"
                    : importFormat === "zip"
                    ? ".zip"
                    : ".enex"
                }
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer flex flex-col items-center"
              >
                {selectedFile ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">Click to select file</p>
                    <p className="text-xs text-gray-500 mt-1">
                      or drag and drop
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {importFormat === "evernote" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Evernote Import Instructions
              </h4>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Open Evernote and select the notes you want to export</li>
                <li>Go to File → Export Notes</li>
                <li>Choose "Evernote XML Format (.enex)"</li>
                <li>Upload the exported file here</li>
              </ol>
            </div>
          )}

          {importResult && (
            <div
              className={`rounded-lg p-4 ${
                importResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h4
                className={`font-medium mb-2 flex items-center gap-2 ${
                  importResult.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Import Successful
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Import Completed with Errors
                  </>
                )}
              </h4>
              <div
                className={`text-sm ${
                  importResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {importResult.imported && (
                  <div className="mb-2">
                    <strong>Imported:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {Object.entries(importResult.imported).map(
                        ([key, value]: [string, any]) =>
                          value > 0 && (
                            <li key={key}>
                              {key}: {value}
                            </li>
                          )
                      )}
                    </ul>
                  </div>
                )}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <strong>Errors:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {importResult.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!selectedFile || importLoading}
            className="w-full"
            size="lg"
          >
            {importLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
