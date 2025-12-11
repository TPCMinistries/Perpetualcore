/**
 * Graceful Shutdown Handler
 *
 * Handles SIGTERM and SIGINT signals to gracefully shut down the server.
 * This ensures in-flight requests complete and resources are properly cleaned up.
 *
 * Usage in instrumentation.ts:
 * ```typescript
 * import { setupGracefulShutdown } from '@/lib/server/graceful-shutdown';
 *
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === 'nodejs') {
 *     setupGracefulShutdown();
 *   }
 * }
 * ```
 */

import { logger } from "@/lib/logging";

interface ShutdownHandler {
  name: string;
  handler: () => Promise<void>;
  timeout?: number;
}

const shutdownHandlers: ShutdownHandler[] = [];
let isShuttingDown = false;

// Default shutdown timeout
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Register a shutdown handler
 * Handlers are called in reverse order (LIFO)
 */
export function registerShutdownHandler(
  name: string,
  handler: () => Promise<void>,
  timeout?: number
): void {
  shutdownHandlers.push({ name, handler, timeout });
  logger.debug("Registered shutdown handler", { name });
}

/**
 * Execute a handler with timeout
 */
async function executeWithTimeout(
  handler: ShutdownHandler
): Promise<{ success: boolean; error?: string }> {
  const timeout = handler.timeout || DEFAULT_TIMEOUT;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        error: `Timeout after ${timeout}ms`,
      });
    }, timeout);

    handler
      .handler()
      .then(() => {
        clearTimeout(timer);
        resolve({ success: true });
      })
      .catch((error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  });
}

/**
 * Execute all shutdown handlers
 */
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress, ignoring signal", { signal });
    return;
  }

  isShuttingDown = true;
  logger.info("Graceful shutdown initiated", { signal });

  // Execute handlers in reverse order (LIFO)
  const handlers = [...shutdownHandlers].reverse();

  for (const handler of handlers) {
    logger.info(`Running shutdown handler: ${handler.name}`);

    const result = await executeWithTimeout(handler);

    if (result.success) {
      logger.info(`Shutdown handler completed: ${handler.name}`);
    } else {
      logger.error(`Shutdown handler failed: ${handler.name}`, {
        error: result.error,
      });
    }
  }

  logger.info("Graceful shutdown complete");

  // Exit after a small delay to allow logs to flush
  setTimeout(() => {
    process.exit(0);
  }, 100);
}

/**
 * Setup graceful shutdown signal handlers
 */
export function setupGracefulShutdown(): void {
  // Only setup once
  if ((global as any).__gracefulShutdownSetup) {
    return;
  }
  (global as any).__gracefulShutdownSetup = true;

  logger.info("Setting up graceful shutdown handlers");

  // Handle SIGTERM (sent by Docker, Kubernetes, etc.)
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });

  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error });
    shutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", {
      error: reason instanceof Error ? reason : new Error(String(reason)),
    });
    // Don't shutdown on unhandled rejections, just log
  });

  // Register a default handler to allow in-flight requests to complete
  registerShutdownHandler(
    "wait-for-requests",
    async () => {
      // Wait a bit to allow in-flight requests to complete
      // In a real implementation, you'd track active requests
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
    10000
  );
}

/**
 * Check if shutdown is in progress
 */
export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}

/**
 * Health check that considers shutdown state
 */
export function isHealthy(): boolean {
  return !isShuttingDown;
}

export default {
  setupGracefulShutdown,
  registerShutdownHandler,
  isShutdownInProgress,
  isHealthy,
};
