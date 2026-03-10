// controllers/cycleController.js
// v3.0 — aligned with new schema:
//   cycle_name → quarter_label  |  deadline_date → deadline
//   status values: draft→Scheduled, active→Active, closed→Closed
//   review status: pending→Not Started, submitted→Submitted
//   cycle_reminders table now seeded from r1_date/r2_date/r3_date
//   bulk_requested_at added for one-time bulk request feature
const db = require("../config/db");

// ── GET /api/cycles ───────────────────────────────────────────────────────────
async function listCycles(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT rc.*,
        COUNT(DISTINCT r.id)                                             AS total_reviews,
        SUM(r.status = 'Submitted')                                      AS submitted_count,
        SUM(r.status = 'Approved')                                       AS approved_count,
        SUM(r.status IN ('Not Started','Initiated','In Progress'))        AS pending_count,
        (SELECT GROUP_CONCAT(reminder_date ORDER BY reminder_number)
         FROM cycle_reminders WHERE cycle_id = rc.id)                    AS reminder_dates
      FROM review_cycles rc
      LEFT JOIN reviews r ON r.cycle_id = rc.id
      GROUP BY rc.id
      ORDER BY rc.start_date DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── GET /api/cycles/:id ───────────────────────────────────────────────────────
async function getCycle(req, res, next) {
  try {
    const [[cycle]] = await db.execute("SELECT * FROM review_cycles WHERE id = ?", [req.params.id]);
    if (!cycle) return res.status(404).json({ success: false, message: "Cycle not found." });

    const [reminders] = await db.execute(
      "SELECT * FROM cycle_reminders WHERE cycle_id = ? ORDER BY reminder_number", [req.params.id]
    );
    const [reviews] = await db.execute(`
      SELECT r.id, r.status,
             e.name AS employee_name, e.code AS employee_code,
             c.name AS client_name
      FROM reviews r
      JOIN employees e ON e.id = r.employee_id
      JOIN clients   c ON c.id = r.client_id
      WHERE r.cycle_id = ?
    `, [req.params.id]);

    const [emailHistory] = await db.execute(
      "SELECT * FROM cycle_email_history WHERE cycle_id = ? ORDER BY sent_at DESC",
      [req.params.id]
    );

    return res.json({ success: true, data: { ...cycle, reminders, reviews, emailHistory } });
  } catch (err) { next(err); }
}

// ── POST /api/cycles ──────────────────────────────────────────────────────────
// Body: { id, quarter_label, year, quarter_num, start_date, deadline, r1_date?, r2_date?, status? }
async function createCycle(req, res, next) {
  const { id, quarter_label, year, quarter_num, start_date, deadline, r1_date, r2_date, r3_date, status } = req.body;
  if (!id || !quarter_label || !year || !quarter_num || !start_date || !deadline) {
    return res.status(400).json({
      success: false,
      message: "id, quarter_label, year, quarter_num, start_date, deadline are required.",
    });
  }
  try {
    await db.execute(
      `INSERT INTO review_cycles
         (id, quarter_label, year, quarter_num, start_date, deadline, r1_date, r2_date, r3_date,
          status, sent_count, submitted_count, closed, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,0,0,?)`,
      [id, quarter_label, year, quarter_num, start_date, deadline,
       r1_date || null, r2_date || null, r3_date || null,
       status || "Scheduled", req.admin.id]
    );
    // Seed cycle_reminders from r1/r2/r3
    for (const [num, date] of [[1, r1_date], [2, r2_date], [3, r3_date]]) {
      if (date) {
        await db.execute(
          "INSERT IGNORE INTO cycle_reminders (cycle_id, reminder_number, reminder_date) VALUES (?,?,?)",
          [id, num, date]
        );
      }
    }
    return res.status(201).json({ success: true, message: "Cycle created.", id });
  } catch (err) { next(err); }
}

// ── PUT /api/cycles/:id ───────────────────────────────────────────────────────
async function updateCycle(req, res, next) {
  const { id } = req.params;
  const { quarter_label, start_date, deadline, r1_date, r2_date, r3_date, status } = req.body;
  try {
    await db.execute(
      `UPDATE review_cycles SET
        quarter_label = COALESCE(?, quarter_label),
        start_date    = COALESCE(?, start_date),
        deadline      = COALESCE(?, deadline),
        r1_date       = COALESCE(?, r1_date),
        r2_date       = COALESCE(?, r2_date),
        r3_date       = COALESCE(?, r3_date),
        status        = COALESCE(?, status),
        updated_at    = NOW()
       WHERE id = ?`,
      [quarter_label, start_date, deadline, r1_date || null, r2_date || null, r3_date || null, status, id]
    );
    return res.json({ success: true, message: "Cycle updated." });
  } catch (err) { next(err); }
}

// ── POST /api/cycles/:id/activate ────────────────────────────────────────────
async function activateCycle(req, res, next) {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[cycle]] = await conn.execute("SELECT * FROM review_cycles WHERE id = ?", [id]);
    if (!cycle) { await conn.rollback(); return res.status(404).json({ success: false, message: "Cycle not found." }); }
    if (cycle.status === "Active") { await conn.rollback(); return res.status(400).json({ success: false, message: "Cycle is already active." }); }

    const [[{ activeCount }]] = await conn.execute(
      "SELECT COUNT(*) AS activeCount FROM review_cycles WHERE status = 'Active'"
    );
    if (activeCount > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: "Another cycle is currently active. Close it before activating a new one." });
    }

    await conn.execute("UPDATE review_cycles SET status = 'Active', updated_at = NOW() WHERE id = ?", [id]);
    await conn.execute("CALL sp_create_cycle_reviews(?, ?)", [id, req.admin.id]);

    await conn.commit();
    return res.json({ success: true, message: "Cycle activated. Reviews created for all active allocations." });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
}

// ── POST /api/cycles/:id/close ────────────────────────────────────────────────
async function closeCycle(req, res, next) {
  const { id } = req.params;
  try {
    await db.execute(
      "UPDATE review_cycles SET status = 'Closed', closed = 1, closed_by = ?, updated_at = NOW() WHERE id = ?",
      [req.admin.id, id]
    );
    return res.json({ success: true, message: "Cycle closed." });
  } catch (err) { next(err); }
}

// ── PUT /api/cycles/:id/reminders ─────────────────────────────────────────────
async function setReminders(req, res, next) {
  const { id } = req.params;
  const { reminder_dates } = req.body;
  if (!Array.isArray(reminder_dates)) {
    return res.status(400).json({ success: false, message: "reminder_dates must be an array of date strings." });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM cycle_reminders WHERE cycle_id = ?", [id]);
    for (let i = 0; i < reminder_dates.length; i++) {
      await conn.execute(
        "INSERT INTO cycle_reminders (cycle_id, reminder_number, reminder_date) VALUES (?,?,?)",
        [id, i + 1, reminder_dates[i]]
      );
    }
    // Also update r1/r2/r3 inline columns for quick access
    await conn.execute(
      `UPDATE review_cycles SET
        r1_date = ?, r2_date = ?, r3_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [reminder_dates[0] || null, reminder_dates[1] || null, reminder_dates[2] || null, id]
    );
    await conn.commit();
    return res.json({ success: true, message: `${reminder_dates.length} reminder(s) saved.` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
}

// ── POST /api/cycles/:id/bulk-request ─────────────────────────────────────────
// Records a one-time bulk request send event (mirrors bulkRequestedCycles in UI state)
async function bulkRequest(req, res, next) {
  const { id } = req.params;
  try {
    const [[cycle]] = await db.execute("SELECT * FROM review_cycles WHERE id = ?", [id]);
    if (!cycle) return res.status(404).json({ success: false, message: "Cycle not found." });
    if (cycle.status !== "Active") return res.status(400).json({ success: false, message: "Bulk request is only available for active cycles." });
    if (cycle.bulk_requested_at) {
      return res.status(409).json({
        success: false,
        message: "Bulk request already sent for this cycle.",
        bulk_requested_at: cycle.bulk_requested_at,
      });
    }
    const now = new Date();
    await db.execute("UPDATE review_cycles SET bulk_requested_at = ?, updated_at = NOW() WHERE id = ?", [now, id]);
    return res.json({ success: true, message: "Bulk request recorded.", bulk_requested_at: now });
  } catch (err) { next(err); }
}

module.exports = { listCycles, getCycle, createCycle, updateCycle, activateCycle, closeCycle, setReminders, bulkRequest };
