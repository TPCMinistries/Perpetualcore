/**
 * Step Runner
 *
 * Executes a single plan step by dispatching to the existing tool registry.
 * Resolves inter-step references ({{step_N.output}}) before execution.
 */

import { executeToolCall } from "@/lib/ai/tools/registry";
import { ToolExecutionContext } from "@/lib/ai/tools/schema";
import { PlanStep, StepResult } from "./types";

/**
 * Execute a single plan step.
 *
 * @param step - The step to execute
 * @param context - Tool execution context (userId, orgId)
 * @param priorResults - Results from previously completed steps
 * @param skillMap - Map of skill tool names to skill IDs
 * @returns The step result with output, exitCode, and timing
 */
export async function runStep(
  step: PlanStep,
  context: ToolExecutionContext,
  priorResults: Record<string, StepResult>,
  skillMap?: Record<string, string>
): Promise<StepResult> {
  const startTime = Date.now();

  try {
    // Resolve inter-step references in args
    const resolvedArgs = resolveStepReferences(step.args, priorResults);

    // Execute via the existing tool registry
    const output = await executeToolCall(
      step.tool,
      resolvedArgs,
      context,
      skillMap
    );

    const timing = Date.now() - startTime;

    // Check if the output indicates an error
    const isError =
      output.startsWith("Error:") || output.startsWith("Error executing");

    return {
      output,
      exitCode: isError ? 1 : 0,
      timing,
      error: isError ? output : undefined,
    };
  } catch (error: unknown) {
    const timing = Date.now() - startTime;
    const message =
      error instanceof Error ? error.message : "Unknown execution error";

    return {
      output: "",
      exitCode: 1,
      timing,
      error: message,
    };
  }
}

/**
 * Resolve {{step_N.output}} placeholders in step arguments
 * with actual outputs from prior step results.
 */
function resolveStepReferences(
  args: Record<string, any>,
  priorResults: Record<string, StepResult>
): Record<string, any> {
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string") {
      resolved[key] = value.replace(
        /\{\{(step_\d+)\.output\}\}/g,
        (_match, stepId) => {
          const result = priorResults[stepId];
          if (result && result.exitCode === 0) {
            return result.output;
          }
          return `[Step ${stepId} output unavailable]`;
        }
      );
    } else if (typeof value === "object" && value !== null) {
      resolved[key] = resolveStepReferences(value, priorResults);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
