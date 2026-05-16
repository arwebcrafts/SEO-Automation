type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  requestId?: string;
  service?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === "production") {
    // JSON output for production (structured logging)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }

  // Pretty-print for development
  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const color = levelColors[level];

  let output = `${color}[${level.toUpperCase()}]${reset} ${timestamp} ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += ` ${JSON.stringify(context)}`;
  }

  if (error) {
    output += `\n${color}Error:${reset} ${error.message}`;
    if (error.stack) {
      output += `\n${error.stack}`;
    }
  }

  return output;
}

function createLogger(defaultContext?: LogContext) {
  return {
    debug(message: string, context?: LogContext) {
      if (shouldLog("debug")) {
        console.debug(formatMessage("debug", message, { ...defaultContext, ...context }));
      }
    },

    info(message: string, context?: LogContext) {
      if (shouldLog("info")) {
        console.info(formatMessage("info", message, { ...defaultContext, ...context }));
      }
    },

    warn(message: string, context?: LogContext) {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", message, { ...defaultContext, ...context }));
      }
    },

    error(message: string, error?: Error | unknown, context?: LogContext) {
      if (shouldLog("error")) {
        const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
        console.error(formatMessage("error", message, { ...defaultContext, ...context }, err));
      }
    },

    child(childContext: LogContext) {
      return createLogger({ ...defaultContext, ...childContext });
    },
  };
}

export const logger = createLogger();
export type Logger = ReturnType<typeof createLogger>;
export { createLogger };
