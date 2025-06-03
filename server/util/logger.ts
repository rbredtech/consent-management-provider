import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf } = format;

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp(),
    printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`),
  ),
  transports: [new transports.Console()],
});
