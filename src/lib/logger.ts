type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const line = JSON.stringify({
      level,
      message,
      time: new Date().toISOString(),
      ...meta,
    });
    if (level === "error") console.error(line);
    else console.log(line);
    return;
  }
  if (meta && Object.keys(meta).length > 0) {
    console[level === "debug" ? "log" : level](message, meta);
  } else {
    console[level === "debug" ? "log" : level](message);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
};
