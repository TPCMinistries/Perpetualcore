"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface StepResult {
  nodeId: string;
  nodeType: string;
  status: "completed" | "failed" | "skipped";
  input: string;
  output: string;
  durationMs: number;
  error?: string;
}

interface WorkflowTestRunnerProps {
  workflowId: string;
  trigger?: React.ReactNode;
}

export function WorkflowTestRunner({
  workflowId,
  trigger,
}: WorkflowTestRunnerProps) {
  const [open, setOpen] = useState(false);
  const [testData, setTestData] = useState("{\n  \n}");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  async function runTest() {
    setRunning(true);
    setResults([]);
    setExecutionError(null);

    try {
      const parsedData = JSON.parse(testData);

      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: parsedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setExecutionError(data.error || "Execution failed");
        toast.error(data.error || "Test execution failed");
        return;
      }

      if (data.node_results) {
        const stepResults: StepResult[] = Object.entries(
          data.node_results as Record<string, Record<string, unknown>>
        ).map(([nodeId, result]) => ({
          nodeId,
          nodeType: (result.type as string) || "unknown",
          status: (result.status as "completed" | "failed" | "skipped") || "completed",
          input: JSON.stringify(result.input || {}, null, 2),
          output: JSON.stringify(result.output || result, null, 2),
          durationMs: (result.durationMs as number) || 0,
          error: result.error as string | undefined,
        }));
        setResults(stepResults);
      }

      if (data.success) {
        toast.success("Test execution completed");
      } else {
        setExecutionError(data.error || "Execution failed");
        toast.error("Test execution failed");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setExecutionError("Invalid JSON in test data");
        toast.error("Invalid JSON in test data");
      } else {
        setExecutionError("An unexpected error occurred");
        toast.error("An error occurred");
      }
    } finally {
      setRunning(false);
    }
  }

  function toggleStep(nodeId: string) {
    setExpandedStep(expandedStep === nodeId ? null : nodeId);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Test Run
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Test Workflow</DialogTitle>
          <DialogDescription>
            Provide test input data and run the workflow to see step-by-step
            results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input */}
          <div className="space-y-2">
            <Label>Test Data (JSON)</Label>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
              placeholder='{"key": "value"}'
            />
          </div>

          {/* Run Button */}
          <Button
            onClick={runTest}
            disabled={running}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>

          {/* Error */}
          {executionError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                {executionError}
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Step-by-Step Results</Label>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {results.map((step, index) => (
                    <div
                      key={step.nodeId}
                      className="border rounded-lg bg-background"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => toggleStep(step.nodeId)}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1">
                          Step {index + 1}: {step.nodeId}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {step.nodeType}
                        </Badge>
                        {step.durationMs > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {step.durationMs}ms
                          </span>
                        )}
                        {expandedStep === step.nodeId ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {expandedStep === step.nodeId && (
                        <div className="px-3 pb-3 space-y-2 border-t">
                          {step.error && (
                            <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
                              {step.error}
                            </div>
                          )}
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Input:
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                              {step.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Output:
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                              {step.output}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
