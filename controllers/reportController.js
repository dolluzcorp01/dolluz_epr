// controllers/reportController.js
// v3.0 — aligned with new schema:
//   v_employee_hike_history  →  now defined in schema additions
//   v_client_submission_summary  →  now defined in schema additions
//   dashboard: employees.active, clients.status, employee_allocations
const db = require("../config/db");
const { exportToExcel } = require("../utils/excel");

// ── GET /api/reports/hike-history?employee_id=... ────────────────────────────
async function hikeHistory(req, res, next) {
  const { employee_id } = req.query;
  try {
    const sql = `
      SELECT * FROM v_employee_hike_history
      ${employee_id ? "WHERE employee_id = ?" : ""}
      ORDER BY employee_name, year DESC, quarter DESC
    `;
    const [rows] = await db.execute(sql, employee_id ? [employee_id] : []);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── GET /api/reports/client-performance?cycle_id=... ─────────────────────────
async function clientPerformance(req, res, next) {
  const { cycle_id } = req.query;
  try {
    const sql = `
      SELECT * FROM v_client_submission_summary
      ${cycle_id ? "WHERE cycle_id = ?" : ""}
      ORDER BY cycle_name, client_name
    `;
    const [rows] = await db.execute(sql, cycle_id ? [cycle_id] : []);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── GET /api/reports/dashboard ────────────────────────────────────────────────
async function dashboardSummary(req, res, next) {
  try {
    const [[activeCycle]] = await db.execute(
      "SELECT id, quarter_label AS cycle_name, deadline FROM review_cycles WHERE status = 'Active' LIMIT 1"
    );

    const [[counts]] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM employees WHERE active = 1)                       AS active_employees,
        (SELECT COUNT(*) FROM clients WHERE status != 'inactive')               AS active_clients,
        (SELECT COUNT(*) FROM employee_allocations WHERE is_active = 1)         AS active_allocations,
        (SELECT COUNT(*) FROM employees e
          WHERE e.active = 1
            AND NOT EXISTS (SELECT 1 FROM employee_allocations a
              WHERE a.employee_id = e.id AND a.is_active = 1))                  AS unallocated_count
    `);

    let reviewStats = null;
    if (activeCycle) {
      const [[stats]] = await db.execute(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'Submitted')  AS submitted,
          SUM(status = 'Approved')   AS approved,
          SUM(status IN ('Not Started','Initiated','In Progress')) AS pending
        FROM reviews WHERE cycle_id = ?
      `, [activeCycle.id]);
      reviewStats = { ...activeCycle, ...stats };
    }

    const [recentNotifs] = await db.execute(
      "SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC LIMIT 10"
    );

    return res.json({
      success: true,
      data: { counts, activeCycle: reviewStats, recentNotifications: recentNotifs },
    });
  } catch (err) { next(err); }
}

// ── GET /api/reports/export?type=hikes|reviews|allocations&cycle_id=...&format=xlsx ──
async function exportReport(req, res, next) {
  const { type, cycle_id } = req.query;

  try {
    let rows = [], filename = "Dolluz_EPR_Report";

    if (type === "hikes") {
      const [data] = await db.execute(
        `SELECT * FROM v_employee_hike_history ${cycle_id ? "WHERE cycle_id = ?" : ""} ORDER BY employee_name`,
        cycle_id ? [cycle_id] : []
      );
      rows = data; filename = "Dolluz_Hike_Report";

    } else if (type === "reviews") {
      const [data] = await db.execute(`
        SELECT r.id,
               e.code AS employee_code,
               e.name AS employee_name,
               e.role AS designation,
               c.name AS client_name,
               rc.quarter_label AS cycle_name,
               s.name  AS stakeholder_name,
               s.email AS stakeholder_email,
               r.status, r.overall_rating,
               r.submitted_at,
               qs.approved_hike
        FROM reviews r
        JOIN employees    e  ON e.id  = r.employee_id
        JOIN clients      c  ON c.id  = r.client_id
        JOIN stakeholders s  ON s.id  = r.stakeholder_id
        JOIN review_cycles rc ON rc.id = r.cycle_id
        LEFT JOIN quarter_scores qs ON qs.employee_id = r.employee_id AND qs.cycle_id = r.cycle_id
        ${cycle_id ? "WHERE r.cycle_id = ?" : ""}
        ORDER BY c.name, e.name
      `, cycle_id ? [cycle_id] : []);
      rows = data; filename = "Dolluz_Reviews_Report";

    } else if (type === "allocations") {
      const [data] = await db.execute(`
        SELECT e.code AS employee_code,
               e.name AS employee_name,
               e.role AS designation,
               c.name AS client_name,
               d.name AS dept_name,
               a.pct  AS allocation_pct,
               a.start_date, a.end_date
        FROM employee_allocations a
        JOIN employees          e ON e.id = a.employee_id
        JOIN clients            c ON c.id = a.client_id
        LEFT JOIN client_departments d ON d.id = a.dept_id
        WHERE a.is_active = 1
        ORDER BY e.name, c.name
      `);
      rows = data; filename = "Dolluz_Allocations_Report";

    } else if (type === "scoring") {
      const [data] = await db.execute(`
        SELECT * FROM v_scoring_pending
        ${cycle_id ? "WHERE cycle_id = ?" : ""}
        ORDER BY employee_name
      `, cycle_id ? [cycle_id] : []);
      rows = data; filename = "Dolluz_Scoring_Report";

    } else {
      return res.status(400).json({ success: false, message: "Unknown report type. Use: hikes, reviews, allocations, scoring." });
    }

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "No data found for the given filters." });
    }

    const buffer  = exportToExcel(rows, filename.replace(/Dolluz_|_Report/g, ""));
    const dateStr = new Date().toISOString().slice(0, 10);
    const fullName = `${filename}_${dateStr}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fullName}"`);
    return res.send(buffer);
  } catch (err) { next(err); }
}

module.exports = { hikeHistory, clientPerformance, dashboardSummary, exportReport };
