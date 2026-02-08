/**
 * Code Execution Types
 * Interfaces for sandboxed code execution via E2B.dev
 */

/** Supported programming languages for code execution */
export type ExecutionLanguage = "python" | "javascript" | "typescript" | "bash" | "r";

/** Status of a code execution */
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "timeout";

/**
 * Request to execute code in a sandboxed environment.
 * Code runs in an isolated E2B sandbox with resource limits.
 */
export interface ExecutionRequest {
  /** Programming language to execute */
  language: ExecutionLanguage;
  /** Source code to execute */
  code: string;
  /** Execution timeout in milliseconds (default: 30000, max: 300000) */
  timeout?: number;
  /** Optional stdin input to provide to the program */
  stdin?: string;
}

/**
 * Result returned from a code execution.
 * Contains stdout/stderr output, exit code, and timing information.
 */
export interface ExecutionResult {
  /** Standard output from the executed code */
  stdout: string;
  /** Standard error output from the executed code */
  stderr: string;
  /** Process exit code (0 = success) */
  exitCode: number;
  /** Actual execution time in milliseconds */
  executionTime: number;
  /** Language that was executed */
  language: ExecutionLanguage;
  /** Unique identifier for the E2B sandbox instance */
  sandboxId: string;
  /** Execution status */
  status: ExecutionStatus;
  /** Error message if execution failed */
  errorMessage?: string;
}

/**
 * User execution quota tracking.
 * Limits the number of code executions per day to prevent abuse.
 */
export interface ExecutionQuota {
  /** User who owns this quota */
  userId: string;
  /** Number of executions used today */
  dailyExecutions: number;
  /** Maximum allowed executions per day (default: 100 for pro, 10 for free) */
  maxDailyExecutions: number;
  /** Timestamp when the daily counter was last reset */
  lastReset: Date;
}

/**
 * Result from a quota check.
 * Indicates whether the user is allowed to execute code.
 */
export interface QuotaCheckResult {
  /** Whether the user is allowed to execute */
  allowed: boolean;
  /** Number of executions remaining today */
  remaining: number;
  /** When the quota resets (next midnight UTC) */
  resetAt: Date;
}

/** Default execution timeout in milliseconds */
export const DEFAULT_TIMEOUT = 30000;

/** Maximum allowed execution timeout in milliseconds (5 minutes) */
export const MAX_TIMEOUT = 300000;

/** Default daily execution limit for pro users */
export const PRO_DAILY_LIMIT = 100;

/** Default daily execution limit for free users */
export const FREE_DAILY_LIMIT = 10;
