export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";
export type LogMessage = { level: LogLevel; timestamp: string; message: string };
export type ShowLogMessage = { command: "showLogMessage"; payload: LogMessage };
