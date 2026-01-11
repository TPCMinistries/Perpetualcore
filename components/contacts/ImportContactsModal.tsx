"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { applyMappings, ContactFieldMapping } from "@/lib/contacts/field-mapper";

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  confidence: string;
}

interface TargetField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface DuplicateMatch {
  importRowIndex: number;
  importData: Record<string, any>;
  existingContact: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
  };
  matchType: string;
  matchConfidence: string;
  matchDetails: string;
}

type Step = "upload" | "map" | "preview" | "import";
type DuplicateDecision = "skip" | "merge" | "create";

export function ImportContactsModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportContactsModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // File data
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  // Mapping
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [targetFields, setTargetFields] = useState<TargetField[]>([]);

  // Duplicates
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, DuplicateDecision>>({});
  const [uniqueRowIndices, setUniqueRowIndices] = useState<number[]>([]);

  // Options
  const [defaultTags, setDefaultTags] = useState("");

  // Import results
  const [importResults, setImportResults] = useState<{
    imported: number;
    merged: number;
    skipped: number;
    failed: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const resetState = () => {
    setStep("upload");
    setFileName("");
    setFileType("");
    setHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);
    setMappings([]);
    setTargetFields([]);
    setDuplicates([]);
    setDuplicateDecisions({});
    setUniqueRowIndices([]);
    setDefaultTags("");
    setImportResults(null);
    setImportProgress(0);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contacts/import/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse file");
      }

      const data = await response.json();

      setFileName(data.fileName);
      setFileType(data.fileType);
      setHeaders(data.headers);
      setPreviewRows(data.preview);
      setTotalRows(data.totalRows);
      setMappings(data.suggestedMappings);
      setTargetFields(data.targetFields);

      setStep("map");
    } catch (error: any) {
      toast.error(error.message || "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/vcard": [".vcf", ".vcard"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, confidence: targetField ? "manual" : "low" }
          : m
      )
    );
  };

  const applyMappingsToData = () => {
    // Convert mappings to the format expected by applyMappings
    const fieldMappings: ContactFieldMapping[] = mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      targetField: m.targetField,
      confidence: (m.confidence === "manual" ? "high" : m.confidence) as ContactFieldMapping["confidence"],
    }));

    return previewRows.map((row) => {
      // Use the proper applyMappings function which handles type conversion
      // (converts comma-separated strings to arrays for tags, skills, etc.)
      return applyMappings(row, fieldMappings);
    });
  };

  const checkDuplicates = async () => {
    setLoading(true);
    try {
      const mappedContacts = applyMappingsToData();

      const response = await fetch("/api/contacts/import/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: mappedContacts }),
      });

      if (!response.ok) {
        throw new Error("Failed to check duplicates");
      }

      const data = await response.json();
      setDuplicates(data.duplicates);
      setUniqueRowIndices(data.uniqueRowIndices);

      // Default all duplicates to "skip"
      const decisions: Record<number, DuplicateDecision> = {};
      for (const dup of data.duplicates) {
        decisions[dup.importRowIndex] = "skip";
      }
      setDuplicateDecisions(decisions);

      setStep("preview");
    } catch (error: any) {
      toast.error(error.message || "Failed to check duplicates");
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      const mappedContacts = applyMappingsToData();

      // Build duplicate existing IDs map
      const duplicateExistingIds: Record<number, string> = {};
      for (const dup of duplicates) {
        duplicateExistingIds[dup.importRowIndex] = dup.existingContact.id;
      }

      // Parse default tags
      const tags = defaultTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: mappedContacts,
          duplicateDecisions,
          duplicateExistingIds,
          defaultTags: tags,
          source: fileType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to import contacts");
      }

      const result = await response.json();
      setImportResults(result);
      setImportProgress(100);
      setStep("import");

      if (result.imported > 0 || result.merged > 0) {
        toast.success(`Imported ${result.imported} contacts, merged ${result.merged}`);
        onImportComplete?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "upload", label: "Upload" },
      { id: "map", label: "Map Fields" },
      { id: "preview", label: "Preview" },
      { id: "import", label: "Import" },
    ];

    const currentIndex = steps.findIndex((s) => s.id === step);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                i < currentIndex && "bg-green-500 text-white",
                i === currentIndex && "bg-primary text-primary-foreground",
                i > currentIndex && "bg-muted text-muted-foreground"
              )}
            >
              {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="ml-2 text-sm hidden sm:inline">{s.label}</span>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 mx-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Import contacts from CSV, Excel, or vCard files
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p>Parsing file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drop your file here</p>
                      <p className="text-sm text-muted-foreground">
                        CSV, Excel (.xlsx), or vCard (.vcf)
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t" />
                <span className="text-sm text-muted-foreground">Or import from</span>
                <div className="flex-1 border-t" />
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" disabled className="gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google Contacts
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.17 2.06A2.33 2.33 0 0 0 19 1H5a2.33 2.33 0 0 0-2.17 1.06A2.42 2.42 0 0 0 2 4v16a2.42 2.42 0 0 0 .83 1.94A2.33 2.33 0 0 0 5 23h14a2.33 2.33 0 0 0 2.17-1.06A2.42 2.42 0 0 0 22 20V4a2.42 2.42 0 0 0-.83-1.94z"
                    />
                  </svg>
                  Outlook
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Google and Outlook import coming soon
              </p>
            </div>
          )}

          {/* Map Fields Step */}
          {step === "map" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="font-medium">{fileName}</span>
                  <Badge variant="secondary">{totalRows} contacts</Badge>
                </div>
              </div>

              <ScrollArea className="h-[350px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">File Column</TableHead>
                      <TableHead className="w-[200px]">Map To</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping) => (
                      <TableRow key={mapping.sourceColumn}>
                        <TableCell className="font-medium">
                          {mapping.sourceColumn}
                          {mapping.confidence === "exact" && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Auto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping.targetField || "_skip_"}
                            onValueChange={(value) =>
                              updateMapping(mapping.sourceColumn, value === "_skip_" ? "" : value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Skip this column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_skip_">Skip this column</SelectItem>
                              {targetFields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  {field.label}
                                  {field.required && " *"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {previewRows[0]?.[mapping.sourceColumn] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="space-y-2">
                <Label>Add tags to all imported contacts</Label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  value={defaultTags}
                  onChange={(e) => setDefaultTags(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              <Tabs defaultValue="duplicates" className="w-full">
                <TabsList>
                  <TabsTrigger value="duplicates">
                    Duplicates ({duplicates.length})
                  </TabsTrigger>
                  <TabsTrigger value="unique">
                    New Contacts ({uniqueRowIndices.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="duplicates" className="mt-4">
                  {duplicates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No duplicates found!</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {duplicates.map((dup) => (
                          <div
                            key={dup.importRowIndex}
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">
                                  {dup.matchDetails}
                                </span>
                                <Badge variant="outline">{dup.matchConfidence}</Badge>
                              </div>
                              <Select
                                value={duplicateDecisions[dup.importRowIndex] || "skip"}
                                onValueChange={(value: DuplicateDecision) =>
                                  setDuplicateDecisions((prev) => ({
                                    ...prev,
                                    [dup.importRowIndex]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="skip">Skip</SelectItem>
                                  <SelectItem value="merge">Merge</SelectItem>
                                  <SelectItem value="create">Create New</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Import Data:</p>
                                <p className="font-medium">
                                  {dup.importData.full_name || dup.importData.email}
                                </p>
                                {dup.importData.email && (
                                  <p className="text-muted-foreground">{dup.importData.email}</p>
                                )}
                                {dup.importData.company && (
                                  <p className="text-muted-foreground">{dup.importData.company}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Existing Contact:</p>
                                <p className="font-medium">{dup.existingContact.full_name}</p>
                                {dup.existingContact.email && (
                                  <p className="text-muted-foreground">
                                    {dup.existingContact.email}
                                  </p>
                                )}
                                {dup.existingContact.company && (
                                  <p className="text-muted-foreground">
                                    {dup.existingContact.company}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="unique" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueRowIndices.slice(0, 20).map((idx) => {
                          const mapped = applyMappingsToData()[idx];
                          return (
                            <TableRow key={idx}>
                              <TableCell>{mapped.full_name || "-"}</TableCell>
                              <TableCell>{mapped.email || "-"}</TableCell>
                              <TableCell>{mapped.company || "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {uniqueRowIndices.length > 20 && (
                      <p className="text-center text-sm text-muted-foreground py-2">
                        And {uniqueRowIndices.length - 20} more...
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                <span>Ready to import:</span>
                <div className="flex gap-4">
                  <span className="text-green-600">
                    {uniqueRowIndices.length} new
                  </span>
                  <span className="text-blue-600">
                    {Object.values(duplicateDecisions).filter((d) => d === "merge").length} merge
                  </span>
                  <span className="text-amber-600">
                    {Object.values(duplicateDecisions).filter((d) => d === "create").length} create
                  </span>
                  <span className="text-muted-foreground">
                    {Object.values(duplicateDecisions).filter((d) => d === "skip").length} skip
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Import Results Step */}
          {step === "import" && importResults && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                {importResults.failed === 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Import Complete!</h3>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Import Completed with Errors</h3>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{importResults.merged}</p>
                  <p className="text-sm text-muted-foreground">Merged</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{importResults.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Errors:</p>
                  <ScrollArea className="h-[150px] border rounded-lg p-3">
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-sm text-red-600">
                        Row {err.row + 1}: {err.message}
                      </p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={checkDuplicates} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("map")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={executeImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Import Contacts
                  </>
                )}
              </Button>
            </>
          )}

          {step === "import" && (
            <>
              <Button variant="outline" onClick={resetState}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Import More
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
