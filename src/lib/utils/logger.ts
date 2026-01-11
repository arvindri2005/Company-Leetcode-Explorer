import { env } from "@/env";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

export interface LogTransport {
  log(entry: LogEntry): void;
}

export class ConsoleTransport implements LogTransport {
  log(entry: LogEntry) {
    const logOutput = JSON.stringify(entry);
    switch (entry.level) {
      case "ERROR":
        console.error(logOutput);
        break;
      case "WARN":
        console.warn(logOutput);
        break;
      case "INFO":
      case "DEBUG":
      default:
        // eslint-disable-next-line no-console
        console.log(logOutput);
        break;
    }
  }
}

class Logger {
  private static transports: LogTransport[] = [new ConsoleTransport()];

  static addTransport(transport: LogTransport) {
    this.transports.push(transport);
  }

  static clearTransports() {
    this.transports = [];
  }

  // Reset to default configuration (mostly for tests)
  static resetTransports() {
    this.transports = [new ConsoleTransport()];
  }

  private static formatError(error: unknown): Record<string, unknown> | undefined {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    if (typeof error === "object" && error !== null) {
      return error as Record<string, unknown>;
    }
    return undefined;
  }

  private static log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = this.formatError(error);
    }

    this.transports.forEach((transport) => {
      try {
        transport.log(entry);
      } catch (err) {
        console.error("Failed to write to log transport:", err);
      }
    });
  }

  static debug(message: string, context?: Record<string, unknown>) {
    // Only log debug in development or if enabled via env
    if (env.NODE_ENV === "development" || (typeof process !== "undefined" && env.LOG_LEVEL === "DEBUG")) {
      this.log("DEBUG", message, context);
    }
  }

  static info(message: string, context?: Record<string, unknown>) {
    this.log("INFO", message, context);
  }

  static warn(message: string, context?: Record<string, unknown>, error?: unknown) {
    this.log("WARN", message, context, error);
  }

  static error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log("ERROR", message, context, error);
  }
}

export { Logger };






