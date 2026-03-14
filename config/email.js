// ─────────────────────────────────────────────────────────────────────────────
//  config/email.js
//  Nodemailer transporter — SMTP (SendGrid, Gmail, or generic).
//  Usage: const transporter = require('../config/email');
//         await transporter.sendMail({ from, to, subject, html });
// ─────────────────────────────────────────────────────────────────────────────

// EMAIL DISABLED — uncomment when SMTP is configured
// const nodemailer = require("nodemailer");
const logger     = require("../utils/logger");

// const transporter = nodemailer.createTransport({
//   host   : process.env.SMTP_HOST || "smtp.sendgrid.net",
//   port   : parseInt(process.env.SMTP_PORT) || 587,
//   secure : parseInt(process.env.SMTP_PORT) === 465,
//   auth   : {
//     user : process.env.SMTP_USER || "apikey",
//     pass : process.env.SMTP_PASS || "",
//   },
//   pool            : true,
//   maxConnections  : 5,
//   rateDelta       : 1000,
//   rateLimit       : 10,
// });
const transporter = null; // placeholder — email disabled

// Verify transporter configuration on startup (non-fatal)
// ── SMTP VERIFY DISABLED (no SMTP configured — mail send is mocked) ────────
// if (process.env.NODE_ENV !== "test") {
//   transporter.verify((err) => {
//     if (err) {
//       logger.warn(`Email transporter warning: ${err.message} — emails will fail until resolved`);
//     } else {
//       logger.info("Email transporter ready");
//     }
//   });
// }

module.exports = transporter;
