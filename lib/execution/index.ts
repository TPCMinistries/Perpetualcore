/**
 * Code Execution Service
 * Main entry point for sandboxed code execution.
 * Handles quota checking, E2B sandbox execution, and logging to Supabase.
 */

import { ToolExecutionContext } from "@/lib/ai/tools/schema";
import { createAdminClient } from "@/lib/supabase/server";
import { ExecutionRequest, ExecutionResult, DEFAULT_TIMEOUT, MAX_TIMEOUT } from "./types";
import { checkExecutionQuota } from "./quota-checker";
import { executeInSandbox } from "./e2b-executor";

/**
 * Execute code in an isolated E2B sandbox.
 * Validates the request, checks user quota, runs the code, and logs the execution.
 *
 * @param request - The code execution request
 * @param context - Tool execution context with user/org info
 * @returns ExecutionResult with output, exit code, and timing
 * @throws Error if quota exceeded or execution fails catastrophically
 */
export async function executeCode(
  request: ExecutionRequest,
  context: ToolExecutionContext
): Promise<ExecutionResult> {
  const supabase = createAdminClient();

  // Validate timeout bounds
  const timeout = Math.min(
    Math.max(request.timeout ?? DEFAULT_TIMEOUT, 1000),
    MAX_TIMEOUT
  );
  const validatedRequest = { ...request, timeout };

  // Check user quota before executing
  const quota = await checkExecutionQuota(context.userId);
  if (!quota.allowed) {
    const result: ExecutionResult = {
      stdout: "",
      stderr: `Daily execution quota exceeded. You have used all ${quota.remaining === 0 ? "allocated" : ""} executions for today. Quota resets at ${quota.resetAt.toISOString()}.`,
      exitCode: 1,
      executionTime: 0,
      language: request.language,
      sandboxId: "none",
      status: "failed",
      errorMessage: "Daily execution quota exceeded",
    };

    // Log the rejected execution attempt
    await logExecution(supabase, context, validatedRequest, result);
    return result;
  }

  // Insert a pending execution record
  const { data: executionRecord } = await supabase
    .from("code_executions")
    .insert({
      user_id: context.userId,
      organization_id: context.organizationId || null,
      language: request.language,
      code: request.code,
      status: "running",
      metadata: {
        timeout,
        hasStdin: !!request.stdin,
        conversationId: context.conversationId || null,
      },
    })
    .select("id")
    .single();

  const executionId = executionRecord?.id;

  try {
    // Execute the code in E2B sandbox
    const result = await executeInSandbox(validatedRequest);

    // Update the execution record with results
    if (executionId) {
      await supabase
        .from("code_executions")
        .update({
          stdout: result.stdout,
          stderr: result.stderr,
          exit_code: result.exitCode,
          execution_time_ms: result.executionTime,
          sandbox_id: result.sandboxId,
          status: result.status,
          error_message: result.errorMessage || null,
        })
        .eq("id", executionId);
    }

    return result;
  } catch (error: any) {
    console.error("[CodeExecution] Unexpected error:", error);

    const errorResult: ExecutionResult = {
      stdout: "",
      stderr: error.message || "An unexpected error occurred during code execution",
      exitCode: 1,
      executionTime: 0,
      language: request.language,
      sandboxId: "unknown",
      status: "failed",
      errorMessage: error.message || "Unexpected execution error",
    };

    // Update the execution record with the error
    if (executionId) {
      await supabase
        .from("code_executions")
        .update({
          status: "failed",
          error_message: error.message || "Unexpected execution error",
        })
        .eq("id", executionId);
    }

    return errorResult;
  }
}

/**
 * Log an execution attempt to the code_executions table.
 * Used for tracking quota-rejected and other pre-execution failures.
 */
async function logExecution(
  supabase: ReturnType<typeof createAdminClient>,
  context: ToolExecutionContext,
  request: ExecutionRequest,
  result: ExecutionResult
): Promise<void> {
  try {
    await supabase.from("code_executions").insert({
      user_id: context.userId,
      organization_id: context.organizationId || null,
      language: request.language,
      code: request.code,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exitCode,
      execution_time_ms: result.executionTime,
      sandbox_id: result.sandboxId,
      status: result.status,
      error_message: result.errorMessage || null,
      metadata: {
        conversationId: context.conversationId || null,
        quotaRejected: result.errorMessage === "Daily execution quota exceeded",
      },
    });
  } catch (error) {
    console.error("[CodeExecution] Error logging execution:", error);
  }
}

// Re-export types for convenience
export type { ExecutionRequest, ExecutionResult } from "./types";
