// controllers/stakeholderController.js  — NEW v3.0
// Full CRUD for stakeholders nested under a client.
// Routes live at /api/clients/:clientId/stakeholders
const db = require("../config/db");

// ── GET /api/clients/:clientId/stakeholders ───────────────────────────────────
async function listStakeholders(req, res, next) {
  const { clientId } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT
        s.id, s.name, s.email, s.designation,
        s.level, s.dept_id, s.active,
        d.name AS dept_name,
        (c.primary_stakeholder_id = s.id) AS is_primary
      FROM stakeholders s
      LEFT JOIN client_departments d ON d.id = s.dept_id
      JOIN clients c ON c.id = s.client_id
      WHERE s.client_id = ?
      ORDER BY s.level, s.name
    `, [clientId]);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── POST /api/clients/:clientId/stakeholders ──────────────────────────────────
// Body: { id?, name, email, designation, level, dept_id?, active? }
async function createStakeholder(req, res, next) {
  const { clientId } = req.params;
  const { id, name, email, designation, level, dept_id, active } = req.body;

  if (!name || !email || !level) {
    return res.status(400).json({ success: false, message: "name, email, and level are required." });
  }
  if (!["client", "dept"].includes(level)) {
    return res.status(400).json({ success: false, message: "level must be 'client' or 'dept'." });
  }
  if (level === "dept" && !dept_id) {
    return res.status(400).json({ success: false, message: "dept_id is required for dept-level stakeholders." });
  }

  // Auto-generate ID if not provided: S{max+1} within client
  let shId = id;
  if (!shId) {
    const [existing] = await db.execute(
      "SELECT id FROM stakeholders WHERE id REGEXP '^S[0-9]+$' ORDER BY CAST(SUBSTRING(id,2) AS UNSIGNED) DESC LIMIT 1"
    );
    const maxNum = existing.length ? parseInt(existing[0].id.slice(1)) : 0;
    shId = `S${maxNum + 1}`;
  }

  try {
    await db.execute(
      `INSERT INTO stakeholders (id, client_id, name, email, designation, level, dept_id, active)
       VALUES (?,?,?,?,?,?,?,?)`,
      [shId, clientId, name, email.toLowerCase().trim(), designation || null, level, dept_id || null, active !== undefined ? active : 1]
    );
    return res.status(201).json({ success: true, message: "Stakeholder added.", id: shId });
  } catch (err) { next(err); }
}

// ── PUT /api/clients/:clientId/stakeholders/:id ───────────────────────────────
async function updateStakeholder(req, res, next) {
  const { clientId, id } = req.params;
  const { name, email, designation, level, dept_id, active } = req.body;

  try {
    const [[sh]] = await db.execute("SELECT id FROM stakeholders WHERE id = ? AND client_id = ?", [id, clientId]);
    if (!sh) return res.status(404).json({ success: false, message: "Stakeholder not found." });

    await db.execute(
      `UPDATE stakeholders SET
        name        = COALESCE(?, name),
        email       = COALESCE(?, email),
        designation = COALESCE(?, designation),
        level       = COALESCE(?, level),
        dept_id     = COALESCE(?, dept_id),
        active      = COALESCE(?, active)
       WHERE id = ? AND client_id = ?`,
      [name, email ? email.toLowerCase().trim() : null, designation, level, dept_id || null,
       active !== undefined ? active : null, id, clientId]
    );
    return res.json({ success: true, message: "Stakeholder updated." });
  } catch (err) { next(err); }
}

// ── DELETE /api/clients/:clientId/stakeholders/:id ───────────────────────────
async function deleteStakeholder(req, res, next) {
  const { clientId, id } = req.params;
  try {
    // Cannot delete if active reviews reference this stakeholder
    const [[{ cnt }]] = await db.execute(`
      SELECT COUNT(*) AS cnt FROM reviews r
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE r.stakeholder_id = ? AND rc.status = 'Active'
    `, [id]);
    if (cnt > 0) {
      return res.status(409).json({ success: false, message: "Cannot remove stakeholder with active reviews. Deactivate instead." });
    }
    // Soft-delete: set active = 0
    await db.execute("UPDATE stakeholders SET active = 0 WHERE id = ? AND client_id = ?", [id, clientId]);
    return res.json({ success: true, message: "Stakeholder deactivated." });
  } catch (err) { next(err); }
}

module.exports = { listStakeholders, createStakeholder, updateStakeholder, deleteStakeholder };
