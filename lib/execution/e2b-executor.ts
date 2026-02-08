/**
 * E2B Sandbox Executor
 * Executes code in isolated E2B.dev sandboxes with resource limits.
 * Uses @e2b/code-interpreter Sandbox for Python (with rich output) and base Sandbox for other languages.
 *
 * @see https://e2b.dev/docs
 */

import { Sandbox as CodeSandbox } from "@e2b/code-interpreter";
import { Sandbox } from "e2b";
import {
  ExecutionRequest,
  ExecutionResult,
  DEFAULT_TIMEOUT,
  MAX_TIMEOUT,
} from "./types";

/**
 * Map of language identifiers to their E2B sandbox execution commands.
 * Used for non-Python languages that run via the general Sandbox.
 */
const LANGUAGE_COMMANDS: Record<string, { command: string; fileExt: string }> = {
  javascript: { command: "node", fileExt: "js" },
  typescript: { command: "npx ts-node", fileExt: "ts" },
  bash: { command: "bash", fileExt: "sh" },
  r: { command: "Rscript", fileExt: "R" },
};

/**
 * Execute code in an E2B sandboxed environment.
 * Python code uses the CodeInterpreter sandbox for rich output support.
 * Other languages use the general Sandbox with file-based execution.
 *
 * @param request - The execution request containing language, code, and options
 * @returns ExecutionResult with stdout, stderr, exit code, and timing
 */
export async function executeInSandbox(
  request: ExecutionRequest
): Promise<ExecutionResult> {
  const timeout = Math.min(request.timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);
  const startTime = Date.now();

  if (request.language === "python") {
    return executePython(request, timeout, startTime);
  }

  return executeGeneral(request, timeout, startTime);
}

/**
 * Execute Python code using E2B code-interpreter Sandbox.
 * Supports rich outputs including plots, DataFrames, and inline results.
 */
async function executePython(
  request: ExecutionRequest,
  timeout: number,
  startTime: number
): Promise<ExecutionResult> {
  let sandbox: CodeSandbox | null = null;

  try {
    sandbox = await CodeSandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: timeout,
    });

    const execution = await sandbox.runCode(request.code, {
      timeoutMs: timeout,
    });

    const executionTime = Date.now() - startTime;

    // Collect stdout from execution logs
    const stdout = execution.logs.stdout.join("\n");
    const stderr = execution.logs.stderr.join("\n");

    // Check for execution errors
    if (execution.error) {
      return {
        stdout,
        stderr: stderr
          ? `${stderr}\n${execution.error.name}: ${execution.error.value}`
          : `${execution.error.name}: ${execution.error.value}`,
        exitCode: 1,
        executionTime,
        language: "python",
        sandboxId: sandbox.sandboxId,
        status: "failed",
        errorMessage: `${execution.error.name}: ${execution.error.value}`,
      };
    }

    // Include any result output (e.g., last expression value)
    let fullStdout = stdout;
    if (execution.results && execution.results.length > 0) {
      const resultTexts = execution.results
        .map((r) => {
          if (r.text) return r.text;
          if (r.html) return "[HTML output]";
          if (r.png) return "[PNG image output]";
          if (r.jpeg) return "[JPEG image output]";
          if (r.svg) return "[SVG output]";
          return "";
        })
        .filter(Boolean);

      if (resultTexts.length > 0) {
        fullStdout = fullStdout
          ? `${fullStdout}\n${resultTexts.join("\n")}`
          : resultTexts.join("\n");
      }
    }

    return {
      stdout: fullStdout,
      stderr,
      exitCode: 0,
      executionTime,
      language: "python",
      sandboxId: sandbox.sandboxId,
      status: "completed",
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Detect timeout errors
    if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
      return {
        stdout: "",
        stderr: `Execution timed out after ${timeout}ms`,
        exitCode: 124,
        executionTime,
        language: "python",
        sandboxId: sandbox?.sandboxId ?? "unknown",
        status: "timeout",
        errorMessage: `Execution timed out after ${timeout}ms`,
      };
    }

    return {
      stdout: "",
      stderr: error.message || "Unknown execution error",
      exitCode: 1,
      executionTime,
      language: "python",
      sandboxId: sandbox?.sandboxId ?? "unknown",
      status: "failed",
      errorMessage: error.message || "Unknown execution error",
    };
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (cleanupError) {
        console.error("[E2B] Error cleaning up Python sandbox:", cleanupError);
      }
    }
  }
}

/**
 * Execute non-Python code using E2B general Sandbox.
 * Writes code to a temp file and executes it with the appropriate runtime.
 */
async function executeGeneral(
  request: ExecutionRequest,
  timeout: number,
  startTime: number
): Promise<ExecutionResult> {
  let sandbox: Sandbox | null = null;
  const langConfig = LANGUAGE_COMMANDS[request.language];

  if (!langConfig) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${request.language}`,
      exitCode: 1,
      executionTime: Date.now() - startTime,
      language: request.language,
      sandboxId: "none",
      status: "failed",
      errorMessage: `Unsupported language: ${request.language}`,
    };
  }

  try {
    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: timeout,
    });

    // Write code to a temp file in the sandbox
    const filename = `/tmp/code.${langConfig.fileExt}`;
    await sandbox.files.write(filename, request.code);

    // If stdin is provided, write it to a file and pipe it
    let command = `${langConfig.command} ${filename}`;
    if (request.stdin) {
      const stdinFile = "/tmp/stdin.txt";
      await sandbox.files.write(stdinFile, request.stdin);
      command = `${command} < ${stdinFile}`;
    }

    // Execute the code
    const result = await sandbox.commands.run(command, {
      timeoutMs: timeout,
    });

    const executionTime = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTime,
      language: request.language,
      sandboxId: sandbox.sandboxId,
      status: result.exitCode === 0 ? "completed" : "failed",
      errorMessage: result.exitCode !== 0 ? result.stderr : undefined,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
      return {
        stdout: "",
        stderr: `Execution timed out after ${timeout}ms`,
        exitCode: 124,
        executionTime,
        language: request.language,
        sandboxId: sandbox?.sandboxId ?? "unknown",
        status: "timeout",
        errorMessage: `Execution timed out after ${timeout}ms`,
      };
    }

    return {
      stdout: "",
      stderr: error.message || "Unknown execution error",
      exitCode: 1,
      executionTime,
      language: request.language,
      sandboxId: sandbox?.sandboxId ?? "unknown",
      status: "failed",
      errorMessage: error.message || "Unknown execution error",
    };
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (cleanupError) {
        console.error("[E2B] Error cleaning up sandbox:", cleanupError);
      }
    }
  }
}
