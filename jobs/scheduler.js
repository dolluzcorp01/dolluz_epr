// jobs/scheduler.js
// v3.0 — aligned with new schema:
//   review status: pending→Not Started, opened→In Progress
//   cycle status: active→Active, closed→Closed
//   stakeholders resolved via JOIN (not inline columns)
//   cycle_stakeholder_email_state / email_logs for reminder tracking
//   r1_date/r2_date/r3_date inline columns on review_cycles
const cron   = require("node-cron");
const db     = require("../config/db");
const { sendEmail } = require("../utils/emailSender");
const logger = require("../utils/logger");

// ── Helper ────────────────────────────────────────────────────────────────────
async function insertNotification(conn, { type, title, message, meta = null }) {
  await conn.execute(
    "INSERT INTO notifications (type, title, message, meta_json) VALUES (?,?,?,?)",
    [type, title, message, meta ? JSON.stringify(meta) : null]
  );
}

// ── Job 1: Process due reminder emails (daily 02:30 UTC = 08:00 IST) ─────────
async function processReminders() {
  logger.info("[Scheduler] Running: processReminders");
  const conn = await db.getConnection();
  try {
    // Use cycle_reminders table (seeded from r1/r2/r3 inline columns)
    const [reminders] = await conn.execute(`
      SELECT
        cr.id AS reminder_id,
        cr.cycle_id, cr.reminder_date, cr.reminder_number,
        (SELECT COUNT(*) FROM cycle_reminders WHERE cycle_id = cr.cycle_id) AS total_reminders,
        rc.quarter_label AS cycle_name, rc.deadline,
        r.id AS review_id, r.status AS review_status,
        s.email AS stakeholder_email, s.name AS stakeholder_name,
        e.name  AS employee_name,
        c.name  AS client_name
      FROM cycle_reminders cr
      JOIN review_cycles rc ON rc.id = cr.cycle_id
      JOIN reviews       r  ON r.cycle_id = cr.cycle_id
      JOIN employees     e  ON e.id = r.employee_id
      JOIN stakeholders  s  ON s.id = r.stakeholder_id
      JOIN clients       c  ON c.id = r.client_id
      WHERE DATE(cr.reminder_date) = CURDATE()
        AND rc.status = 'Active'
        AND r.status IN ('Not Started','Initiated')
        AND NOT EXISTS (
          SELECT 1 FROM review_reminder_logs rrl
          WHERE rrl.review_id = r.id AND rrl.reminder_number = cr.reminder_number
        )
    `);

    let sent = 0;
    for (const row of reminders) {
      try {
        await sendEmail("reminder", row.stakeholder_email, {
          StakeholderName : row.stakeholder_name,
          EmployeeName    : row.employee_name,
          Quarter         : row.cycle_name,
          ClientName      : row.client_name,
          Deadline        : new Date(row.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
          ReviewLink      : `${process.env.STAKEHOLDER_FORM_URL}?r=${row.review_id}`,
          ReminderNumber  : String(row.reminder_number),
          TotalReminders  : String(row.total_reminders),
        });
        await conn.execute(
          "INSERT INTO review_reminder_logs (review_id, reminder_number, sent_at) VALUES (?,?,NOW())",
          [row.review_id, row.reminder_number]
        );
        sent++;
      } catch (e) {
        logger.error(`[Scheduler] Reminder failed for review ${row.review_id}: ${e.message}`);
      }
    }
    logger.info(`[Scheduler] processReminders done — ${sent} sent`);
  } finally { conn.release(); }
}

// ── Job 2: Billing leakage detection (daily 03:30 UTC = 09:00 IST) ───────────
async function detectBillingLeakage() {
  logger.info("[Scheduler] Running: detectBillingLeakage");
  const conn = await db.getConnection();
  try {
    const [leaky] = await conn.execute(`
      SELECT e.id, e.code AS employee_code, e.name
      FROM employees e
      WHERE e.active = 1
        AND NOT EXISTS (
          SELECT 1 FROM employee_allocations a
          WHERE a.employee_id = e.id AND a.is_active = 1 AND a.pct > 0
        )
    `);
    if (!leaky.length) return;

    const [existing] = await conn.execute(
      "SELECT id FROM notifications WHERE type = 'leakage' AND DATE(created_at) = CURDATE() LIMIT 1"
    );
    if (existing.length) return;

    const names = leaky.map(e => `${e.name} (${e.employee_code})`).join(", ");
    await insertNotification(conn, {
      type    : "leakage",
      title   : `${leaky.length} Unallocated Resource${leaky.length > 1 ? "s" : ""} Detected`,
      message : `Active employees with no current allocation: ${names}`,
      meta    : { employee_ids: leaky.map(e => e.id) },
    });
    logger.info(`[Scheduler] detectBillingLeakage — ${leaky.length} flagged`);
  } finally { conn.release(); }
}

// ── Job 3: Cycle deadline approaching (daily 02:00 UTC = 07:30 IST) ──────────
async function checkDeadlines() {
  logger.info("[Scheduler] Running: checkDeadlines");
  const conn = await db.getConnection();
  try {
    const [cycles] = await conn.execute(`
      SELECT id, quarter_label AS cycle_name, deadline,
        DATEDIFF(deadline, CURDATE()) AS days_remaining
      FROM review_cycles
      WHERE status = 'Active'
        AND deadline >= CURDATE()
        AND DATEDIFF(deadline, CURDATE()) IN (7, 1)
    `);
    for (const cycle of cycles) {
      const [ex] = await conn.execute(
        "SELECT id FROM notifications WHERE type = 'cycle_deadline_approaching' AND meta_json LIKE ? AND DATE(created_at) = CURDATE() LIMIT 1",
        [`%"cycle_id":"${cycle.id}"%`]
      );
      if (ex.length) continue;
      await insertNotification(conn, {
        type    : "cycle_deadline_approaching",
        title   : `${cycle.cycle_name} deadline in ${cycle.days_remaining} day${cycle.days_remaining === 1 ? "" : "s"}`,
        message : `The ${cycle.cycle_name} cycle closes on ${new Date(cycle.deadline).toLocaleDateString("en-IN")}. Follow up on pending reviews.`,
        meta    : { cycle_id: cycle.id, days_remaining: cycle.days_remaining },
      });
    }
    logger.info(`[Scheduler] checkDeadlines — ${cycles.length} deadline(s) found`);
  } finally { conn.release(); }
}

// ── Job 4: Clean expired OTPs (every hour) ────────────────────────────────────
async function cleanExpiredOtps() {
  try {
    const [r] = await db.execute("DELETE FROM stakeholder_otps WHERE expires_at < NOW()");
    if (r.affectedRows > 0) logger.info(`[Scheduler] cleanExpiredOtps — removed ${r.affectedRows} expired OTP(s)`);
  } catch (err) {
    logger.warn(`[Scheduler] cleanExpiredOtps warning: ${err.message}`);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
function start() {
  cron.schedule("30 2 * * *", processReminders,     { timezone: "UTC" }); // 08:00 IST
  cron.schedule("30 3 * * *", detectBillingLeakage, { timezone: "UTC" }); // 09:00 IST
  cron.schedule("0 2 * * *",  checkDeadlines,        { timezone: "UTC" }); // 07:30 IST
  cron.schedule("0 * * * *",  cleanExpiredOtps,       { timezone: "UTC" }); // Hourly
  logger.info("[Scheduler] All cron jobs registered");
}

module.exports = { start, processReminders, detectBillingLeakage, checkDeadlines };
