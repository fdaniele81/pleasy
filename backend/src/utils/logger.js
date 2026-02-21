import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logDir = path.join(__dirname, "../../logs");

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  defaultMeta: { service: "planulo-api" },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

const auditLogger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "planulo-audit" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "audit.log"),
      format: fileFormat,
      maxsize: 10485760,
      maxFiles: 10,
    }),
    ...(isProduction
      ? []
      : [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]),
  ],
});

function audit(event, details) {
  auditLogger.info(event, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}

export const debug = (message, meta = {}) => logger.debug(message, meta);
export const info = (message, meta = {}) => logger.info(message, meta);
export const warn = (message, meta = {}) => logger.warn(message, meta);
export const error = (message, meta = {}) => logger.error(message, meta);

export { audit };

export { logger, auditLogger };

export default {
  debug,
  info,
  warn,
  error,
  audit,
  logger,
  auditLogger,
};
