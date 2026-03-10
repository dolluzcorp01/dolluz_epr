// ─────────────────────────────────────────────────────────────────────────────
//  config/email.js
//  Nodemailer transporter — SMTP (SendGrid, Gmail, or generic).
//  Usage: const transporter = require('../config/email');
//         await transporter.sendMail({ from, to, subject, html });
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require("nodemailer");
const logger     = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host   : process.env.SMTP_HOST || "smtp.sendgrid.net",
  port   : parseInt(process.env.SMTP_PORT) || 587,
  secure : parseInt(process.env.SMTP_PORT) === 465,   // true for port 465
  auth   : {
    user : process.env.SMTP_USER || "apikey",
    pass : process.env.SMTP_PASS || "",
  },
  pool            : true,      // Use connection pooling for burst sends
  maxConnections  : 5,
  rateDelta       : 1000,      // 1 second between batches
  rateLimit       : 10,        // Max 10 emails/second (SendGrid free limit)
});

// Verify transporter configuration on startup (non-fatal)
if (process.env.NODE_ENV !== "test") {
  transporter.verify((err) => {
    if (err) {
      logger.warn(`Email transporter warning: ${err.message} — emails will fail until resolved`);
    } else {
      logger.info("Email transporter ready");
    }
  });
}

module.exports = transporter;
