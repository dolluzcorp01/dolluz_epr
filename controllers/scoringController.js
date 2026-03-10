// controllers/scoringController.js
// v3.0 — aligned with new schema:
//   scoring model is quarter_scores (per employee/cycle, not per review)
//   scoring_locked replaces is_locked  |  approved_hike replaces approved_hike_pct
//   score replaces weighted_sum  |  ctc_at_time snapshot
//   competencies table stays the same (weights)
//   toggleLock: lock sets Closed status in UI via scoring_locked flag
const db = require("../config/db");

// ── GET /api/scoring?cycle_id=... ────────────────────────────────────────────
async function listScoring(req, res, next) {
  const { cycle_id } = req.query;
  try {
    const params = [];
    let where = "WHERE 1=1";
    if (cycle_id) { where += " AND qs.cycle_id = ?"; params.push(cycle_id); }

    const [rows] = await db.execute(`
      SELECT
        e.id           AS employee_id,
        e.code         AS employee_code,
        e.name         AS employee_name,
        e.role         AS designation,
        e.ctc          AS base_ctc,
        c_list.client_names,
        qs.cycle_id,
        rc.quarter_label AS cycle_name,
        qs.score,
        qs.ctc_at_time,
        qs.approved_hike,
        qs.scoring_locked,
        qs.locked_at,
        qs.unlocked_at,
        -- derive suggested hike from score tiers (mirrors sp_compute_score logic)
        CASE
          WHEN qs.score >= 90 THEN 22.00
          WHEN qs.score >= 80 THEN 18.00
          WHEN qs.score >= 70 THEN 14.00
          WHEN qs.score >= 60 THEN 10.00
          ELSE 6.00
        END AS suggested_hike,
        -- aggregate review status for this employee/cycle
        (SELECT GROUP_CONCAT(DISTINCT r.status ORDER BY r.status)
         FROM reviews r
         WHERE r.employee_id = e.id AND r.cycle_id = qs.cycle_id) AS review_statuses
      FROM quarter_scores qs
      JOIN employees e ON e.id = qs.employee_id
      JOIN review_cycles rc ON rc.id = qs.cycle_id
      LEFT JOIN (
        SELECT a.employee_id,
               GROUP_CONCAT(DISTINCT cl.name ORDER BY cl.name SEPARATOR ', ') AS client_names
        FROM employee_allocations a
        JOIN clients cl ON cl.id = a.client_id
        WHERE a.is_active = 1
        GROUP BY a.employee_id
      ) c_list ON c_list.employee_id = e.id
      ${where}
      ORDER BY rc.start_date DESC, qs.score DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── POST /api/scoring/:employee_id/compute?cycle_id=... ──────────────────────
// Re-run score computation for a single employee in a cycle
async function computeScore(req, res, next) {
  const { employee_id } = req.params;
  const { cycle_id } = req.query;
  if (!cycle_id) return res.status(400).json({ success: false, message: "cycle_id query param is required." });

  try {
    // Find the review for this employee/cycle
    const [[rev]] = await db.execute(
      "SELECT id FROM reviews WHERE employee_id = ? AND cycle_id = ? AND status = 'Submitted' LIMIT 1",
      [employee_id, cycle_id]
    );
    if (!rev) return res.status(404).json({ success: false, message: "No submitted review found for this employee/cycle." });

    await db.execute("CALL sp_compute_score(?, ?)", [rev.id, cycle_id]);

    const [[qs]] = await db.execute(
      "SELECT * FROM quarter_scores WHERE employee_id = ? AND cycle_id = ?", [employee_id, cycle_id]
    );
    return res.json({ success: true, message: "Score recomputed.", data: qs });
  } catch (err) { next(err); }
}

// ── PUT /api/scoring/:employee_id/hike?cycle_id=... ──────────────────────────
// Set the approved hike for an employee in a cycle
async function approveHike(req, res, next) {
  const { employee_id } = req.params;
  const { cycle_id, approved_hike } = req.body;
  if (!cycle_id || approved_hike === undefined) {
    return res.status(400).json({ success: false, message: "cycle_id and approved_hike are required." });
  }

  try {
    const [[qs]] = await db.execute(
      "SELECT scoring_locked FROM quarter_scores WHERE employee_id = ? AND cycle_id = ?",
      [employee_id, cycle_id]
    );
    if (!qs) return res.status(404).json({ success: false, message: "Scoring record not found." });
    if (qs.scoring_locked) return res.status(403).json({ success: false, message: "Score is locked and cannot be modified." });

    await db.execute(
      "UPDATE quarter_scores SET approved_hike = ?, updated_at = NOW() WHERE employee_id = ? AND cycle_id = ?",
      [approved_hike, employee_id, cycle_id]
    );
    return res.json({ success: true, message: "Hike approved." });
  } catch (err) { next(err); }
}

// ── PUT /api/scoring/:employee_id/lock?cycle_id=... ──────────────────────────
// Lock or unlock the score (mirrors toggleLk in UI)
// Lock:   scoring_locked=1 → UI shows status "Closed"
// Unlock: scoring_locked=0 → UI falls back to Approved/Submitted
async function lockScore(req, res, next) {
  const { employee_id } = req.params;
  const { cycle_id, lock } = req.body; // lock: true/false
  if (!cycle_id || lock === undefined) {
    return res.status(400).json({ success: false, message: "cycle_id and lock (bool) are required." });
  }

  try {
    const now = new Date();
    await db.execute(
      `UPDATE quarter_scores SET
        scoring_locked = ?,
        locked_at      = IF(?, ?, locked_at),
        unlocked_at    = IF(?, ?, unlocked_at),
        updated_at     = NOW()
       WHERE employee_id = ? AND cycle_id = ?`,
      [lock ? 1 : 0, lock ? 1 : 0, now, !lock ? 1 : 0, now, employee_id, cycle_id]
    );
    return res.json({ success: true, message: lock ? "Score locked." : "Score unlocked." });
  } catch (err) { next(err); }
}

// ── GET /api/scoring/competencies ─────────────────────────────────────────────
async function listCompetencies(req, res, next) {
  try {
    const [rows] = await db.execute("SELECT * FROM competencies ORDER BY display_order");
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── PUT /api/scoring/competencies/:id ─────────────────────────────────────────
async function updateCompetency(req, res, next) {
  const { id } = req.params;
  const { weight, name } = req.body;
  try {
    // Validate total weights still sum to 100
    if (weight !== undefined) {
      const [[{ currentWeight }]] = await db.execute(
        "SELECT weight AS currentWeight FROM competencies WHERE id = ?", [id]
      );
      const [[{ total }]] = await db.execute(
        "SELECT SUM(weight) AS total FROM competencies WHERE id != ?", [id]
      );
      if (parseFloat(total) + parseFloat(weight) > 100) {
        return res.status(400).json({
          success: false,
          message: `Weight would push total above 100. Other competencies total: ${total}.`,
        });
      }
    }
    await db.execute(
      "UPDATE competencies SET weight = COALESCE(?, weight), name = COALESCE(?, name) WHERE id = ?",
      [weight, name, id]
    );
    return res.json({ success: true, message: "Competency updated." });
  } catch (err) { next(err); }
}

module.exports = { listScoring, computeScore, approveHike, lockScore, listCompetencies, updateCompetency };
