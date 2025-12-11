/**
 * Structured Logging Infrastructure
 *
 * Provides consistent, structured logging for production and development.
 * In production, outputs JSON for easy parsing by log aggregation services.
 * In development, outputs human-readable formatted logs.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logging';
 *
 * logger.info('User logged in', { userId: '123', method: 'email' });
 * logger.error('Payment failed', { orderId: '456', error: err });
 * logger.warn('Rate limit approaching', { userId: '123', remaining: 5 });
 * logger.debug('Cache miss', { key: 'user:123' });
 * ```
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  duration?: number;
  statusCode?: number;
  path?: string;
  method?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Get environment settings
const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";
const serviceName = process.env.SERVICE_NAME || "perpetual-core";
const environment = process.env.NODE_ENV || "development";

// Log levels priority
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (configurable via env)
const minLogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "info");

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment && !isTest) {
    // Human-readable format for development
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    const color = levelColors[entry.level];

    let output = `${timestamp} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  ${entry.error.stack.split("\n").slice(1, 4).join("\n  ")}`;
      }
    }

    return output;
  }

  // JSON format for production
  return JSON.stringify(entry);
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Suppress logs in test
  return LOG_LEVELS[level] >= LOG_LEVELS[minLogLevel];
}

/**
 * Extract error information safely
 */
function extractError(err: unknown): LogEntry["error"] | undefined {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: isDevelopment ? err.stack : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: String(err),
  };
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: serviceName,
    environment,
  };

  if (context) {
    // Extract special fields from context
    const { error, requestId, userId, organizationId, duration, statusCode, path, method, ...rest } = context;

    if (requestId) entry.requestId = String(requestId);
    if (userId) entry.userId = String(userId);
    if (organizationId) entry.organizationId = String(organizationId);
    if (duration) entry.duration = Number(duration);
    if (statusCode) entry.statusCode = Number(statusCode);
    if (path) entry.path = String(path);
    if (method) entry.method = String(method);
    if (error) entry.error = extractError(error);

    // Store remaining context
    if (Object.keys(rest).length > 0) {
      entry.context = rest;
    }
  }

  return entry;
}

/**
 * Output a log entry
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context);
  const output = formatLogEntry(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Main logger object
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),

  /**
   * Create a child logger with preset context
   */
  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log("warn", message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) =>
      log("error", message, { ...defaultContext, ...context }),
  }),

  /**
   * Log an API request
   */
  request: (
    method: string,
    path: string,
    context?: LogContext & { statusCode?: number; duration?: number }
  ) => {
    const level = (context?.statusCode ?? 200) >= 400 ? "error" : "info";
    log(level, `${method} ${path}`, { method, path, ...context });
  },

  /**
   * Log a security event
   */
  security: (event: string, context?: LogContext) => {
    log("warn", `[SECURITY] ${event}`, { securityEvent: event, ...context });
  },

  /**
   * Log a performance metric
   */
  metric: (name: string, value: number, context?: LogContext) => {
    log("info", `[METRIC] ${name}: ${value}`, { metricName: name, metricValue: value, ...context });
  },
};

/**
 * Create a request logger for API routes
 */
export function createRequestLogger(requestId?: string, userId?: string, organizationId?: string) {
  return logger.child({
    requestId: requestId || crypto.randomUUID(),
    userId,
    organizationId,
  });
}

/**
 * Timer utility for measuring duration
 */
export function createTimer() {
  const start = performance.now();
  return {
    elapsed: () => Math.round(performance.now() - start),
    end: (message: string, context?: LogContext) => {
      const duration = Math.round(performance.now() - start);
      logger.info(message, { duration, ...context });
      return duration;
    },
  };
}

export default logger;
