// ─────────────────────────────────────────────────────────────────────────────
//  Dolluz EPR Portal — Express Server  v3.0
//  Aligned with new schema + all v3 routes
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const scheduler = require("./jobs/scheduler");

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const clientRoutes = require("./routes/clients");       // includes /clients/:id/stakeholders
const allocationRoutes = require("./routes/allocations");
const cycleRoutes = require("./routes/cycles");
const reviewRoutes = require("./routes/reviews");       // includes /bulk-request
const scoringRoutes = require("./routes/scoring");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");
const announcementRoutes = require("./routes/announcements");
const settingsRoutes = require("./routes/settings");      // includes /profile
const emailDispatchRoutes = require("./routes/emailDispatch");
const emailTemplateRoutes = require("./routes/emailTemplates"); // NEW

const app = express();
const PORT = process.env.PORT || 4321;

// ── Ensure upload directory ───────────────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.PORTAL_URL || "https://epr.dolluz.com",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please try again later." },
});
app.use("/api/", globalLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} — ${req.ip}`);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "OK", timestamp: new Date().toISOString(), version: "3.0.0" });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/clients", clientRoutes);          // GET /api/clients/:id/stakeholders etc.
app.use("/api/allocations", allocationRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/scoring", scoringRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/email-dispatch", emailDispatchRoutes);
app.use("/api/email-templates", emailTemplateRoutes);   // NEW

// ── Serve uploaded files (protected) ─────────────────────────────────────────
app.use("/uploads", require("./middleware/auth").verifyAdminToken, express.static(uploadDir));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Dolluz EPR API v3.0 running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  scheduler.start();
});

module.exports = app;
