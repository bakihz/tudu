const winston = require("winston");
const path = require("path");

// Create logs directory if it doesn't exist with better error handling
const fs = require("fs");
let logsDir;
let useFileLogging = true;

try {
  // Try to use the application directory first
  logsDir = path.join(__dirname, "..", "..", "logs");

  // Ensure the directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Test if we can write to the directory
  const testFile = path.join(logsDir, "test.log");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
} catch (error) {
  console.warn(
    "Cannot create logs directory, using console only:",
    error.message
  );
  useFileLogging = false;
}

const loggerConfig = {
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "tudu-app" },
  transports: [],
};

// Add file transports only if we can write to files
if (useFileLogging && logsDir) {
  try {
    loggerConfig.transports.push(
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    console.warn("Cannot setup file logging:", error.message);
    useFileLogging = false;
  }
}

// Always add console transport
loggerConfig.transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

const logger = winston.createLogger(loggerConfig);

module.exports = logger;
