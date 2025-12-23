/**
 * @file logger.ts
 * @description A centralized, structured logger to replace raw console calls.
 * Provides consistent formatting, log levels, and better observability.
 *
 * ✨ Spark Polish:
 * - JSON output in production for better parsing by observability tools.
 * - Colorful, readable output in development for a better developer experience.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  error?: Error | unknown;
}

const isDev = process.env.NODE_ENV === "development";

const formatError = (error: unknown): Record<string, any> => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
    };
  }
  if (typeof error === "object" && error !== null) {
    return error as Record<string, any>;
  }
  return { message: String(error) };
};

class LoggerService {
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: unknown) {
    const timestamp = new Date().toISOString();

    // Structure the log entry
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context,
    };

    if (error) {
      entry.error = formatError(error);
    }

    if (isDev) {
      // 🎨 Spark Polish: Development - Human Readable
      const colorMap = {
        debug: "\x1b[34m", // Blue
        info: "\x1b[32m", // Green
        warn: "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
      };
      const reset = "\x1b[0m";
      const color = colorMap[level] || reset;

      console[level](
        `${color}[${level.toUpperCase()}]${reset} ${message}`,
        context ? "\nContext:" : "",
        context || "",
        error ? "\nError:" : "",
        error || ""
      );
    } else {
      // 🤖 Production - Machine Readable (JSON)
      // We use console[level] so that severity is correctly captured by cloud runtimes (e.g. GCP, AWS)
      console[level](JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: unknown) {
    this.log("warn", message, context, error);
  }

  error(message: string, error?: unknown, context?: Record<string, any>) {
    this.log("error", message, context, error);
  }
}

export const Logger = new LoggerService();
