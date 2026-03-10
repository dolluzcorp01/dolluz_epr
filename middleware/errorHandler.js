// middleware/errorHandler.js — Global Express error handler
const logger = require("../utils/logger");

function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, err);

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "A record with these details already exists." });
  }

  // JWT errors (should be caught in middleware, but just in case)
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Authentication error." });
  }

  // Multer file size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.` });
  }

  const status  = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "An internal server error occurred."
    : err.message || "An unexpected error occurred.";

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
