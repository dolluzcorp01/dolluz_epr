// utils/logger.js — Winston structured logger
const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) =>
      stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename : path.join(process.cwd(), "logs", "error.log"),
      level    : "error",
      maxsize  : 5_242_880,  // 5 MB
      maxFiles : 5,
    }),
    new transports.File({
      filename : path.join(process.cwd(), "logs", "combined.log"),
      maxsize  : 10_485_760, // 10 MB
      maxFiles : 5,
    }),
  ],
});

module.exports = logger;
