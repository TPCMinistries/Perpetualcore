"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  required?: boolean;
}

export interface TargetField {
  key: string;
  label: string;
  type?: "string" | "number" | "date" | "boolean";
  required?: boolean;
}

export interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "tasks" | "contacts" | "projects";
  targetFields: TargetField[];
  onImportComplete?: (imported: number, failed: number) => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "complete";

export function ExcelImportDialog({
  open,
  onOpenChange,
  entityType,
  targetFields,
  onImportComplete,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview data from server
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});

  // Mappings
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Import results
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("upload");
      setFile(null);
      setError(null);
      setSourceHeaders([]);
      setPreviewData([]);
      setMappings([]);
      setImportResult(null);
    }
    onOpenChange(open);
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }
    setFile(selectedFile);
    setError(null);
  }, []);

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload and preview file
  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "preview");

      const response = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse file");
      }

      setSourceHeaders(data.headers);
      setPreviewData(data.preview);
      setTotalRows(data.totalRows);
      setColumnTypes(data.columnTypes || {});

      // Auto-map fields by matching names
      const autoMappings: FieldMapping[] = targetFields.map((field) => {
        const matchingSource = data.headers.find(
          (h: string) =>
            h.toLowerCase().replace(/[_\s]/g, "") ===
            field.key.toLowerCase().replace(/[_\s]/g, "")
        );
        return {
          sourceColumn: matchingSource || "",
          targetField: field.key,
          required: field.required,
        };
      });
      setMappings(autoMappings);

      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  // Update mapping
  const updateMapping = (targetField: string, sourceColumn: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.targetField === targetField ? { ...m, sourceColumn } : m
      )
    );
  };

  // Run import
  const handleImport = async () => {
    if (!file) return;

    setStep("importing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "import");
      formData.append("entityType", entityType);
      formData.append(
        "mappings",
        JSON.stringify(
          mappings
            .filter((m) => m.sourceColumn)
            .map((m) => ({
              source: m.sourceColumn,
              target: m.targetField,
              required: m.required,
            }))
        )
      );

      const response = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setImportResult({
        imported: data.imported || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });

      setStep("complete");

      if (data.imported > 0 && onImportComplete) {
        onImportComplete(data.imported, data.failed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("mapping");
    }
  };

  // Check if required mappings are complete
  const requiredMappingsComplete = mappings
    .filter((m) => m.required)
    .every((m) => m.sourceColumn);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)} from Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload your Excel or CSV file to get started"}
            {step === "mapping" && "Map your columns to the correct fields"}
            {step === "preview" && "Review your data before importing"}
            {step === "importing" && "Importing your data..."}
            {step === "complete" && "Import complete"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          {(["upload", "mapping", "complete"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step === "complete" || (step === "mapping" && i === 0)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step === "complete" || (step === "mapping" && i === 0) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <div
                  className={cn(
                    "h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50",
                    file && "border-green-500 bg-green-50 dark:bg-green-950/20"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-12 w-12 text-green-500" />
                      <div className="text-center">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">
                          Drag and drop your file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && handleFileSelect(e.target.files[0])
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => inputRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Mapping */}
            {step === "mapping" && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">
                    Found {totalRows} rows in your file
                  </p>
                  <Badge variant="outline">
                    {sourceHeaders.length} columns detected
                  </Badge>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target Field</TableHead>
                        <TableHead>Source Column</TableHead>
                        <TableHead>Sample Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targetFields.map((field) => {
                        const mapping = mappings.find(
                          (m) => m.targetField === field.key
                        );
                        const sampleValue = mapping?.sourceColumn
                          ? previewData[0]?.[mapping.sourceColumn]
                          : null;

                        return (
                          <TableRow key={field.key}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{field.label}</span>
                                {field.required && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={mapping?.sourceColumn || ""}
                                onValueChange={(v) =>
                                  updateMapping(field.key, v)
                                }
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">-- Skip --</SelectItem>
                                  {sourceHeaders.map((header) => (
                                    <SelectItem key={header} value={header}>
                                      {header}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {sampleValue || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep("upload")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!requiredMappingsComplete}
                    className="gap-2"
                  >
                    Import {totalRows} rows
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Importing */}
            {step === "importing" && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Importing your data...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process {totalRows} rows
                </p>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === "complete" && importResult && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col"
              >
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  {importResult.imported > 0 ? (
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xl font-semibold">
                      {importResult.imported > 0
                        ? `Successfully imported ${importResult.imported} ${entityType}`
                        : "Import failed"}
                    </p>
                    {importResult.failed > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {importResult.failed} rows failed
                      </p>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <ScrollArea className="w-full max-h-32 mt-4 border rounded-lg p-3">
                      <div className="space-y-1 text-sm text-red-600 dark:text-red-400">
                        {importResult.errors.map((err, i) => (
                          <p key={i}>{err}</p>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleOpenChange(false)}>Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pre-defined target fields for common entities
export const IMPORT_FIELDS = {
  tasks: [
    { key: "title", label: "Title", required: true },
    { key: "description", label: "Description" },
    { key: "status", label: "Status", type: "string" as const },
    { key: "priority", label: "Priority", type: "string" as const },
    { key: "due_date", label: "Due Date", type: "date" as const },
  ],
  contacts: [
    { key: "first_name", label: "First Name", required: true },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "company", label: "Company" },
    { key: "job_title", label: "Job Title" },
    { key: "notes", label: "Notes" },
    { key: "tags", label: "Tags" },
  ],
  projects: [
    { key: "name", label: "Name", required: true },
    { key: "description", label: "Description" },
    { key: "current_stage", label: "Stage" },
    { key: "priority", label: "Priority" },
    { key: "start_date", label: "Start Date", type: "date" as const },
    { key: "target_date", label: "Target Date", type: "date" as const },
  ],
};
