// controllers/clientController.js
// v3.0 — aligned with new schema:
//   client_code → code  |  client_name → name  |  is_active → status
//   primary_contact_* → pc_*  |  added color_hex
//   departments → client_departments
//   stakeholders: full_name → name, is_active → active, department_id → dept_id
//   allocations → employee_allocations, allocation_pct → pct
const db = require("../config/db");

// ── GET /api/clients ──────────────────────────────────────────────────────────
async function listClients(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT
        c.id, c.code, c.name, c.industry, c.status, c.color_hex,
        c.primary_domain, c.primary_stakeholder_id,
        c.pc_name, c.pc_email, c.pc_phone,
        c.notes, c.created_at, c.updated_at,
        COUNT(DISTINCT a.employee_id) AS active_resource_count,
        ps.name  AS primary_stakeholder_name,
        ps.email AS primary_stakeholder_email
      FROM clients c
      LEFT JOIN employee_allocations a  ON a.client_id = c.id AND a.is_active = 1
      LEFT JOIN stakeholders         ps ON ps.id = c.primary_stakeholder_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── GET /api/clients/:id ──────────────────────────────────────────────────────
async function getClient(req, res, next) {
  try {
    const [[client]] = await db.execute(`
      SELECT
        c.*,
        ps.name        AS primary_stakeholder_name,
        ps.email       AS primary_stakeholder_email,
        ps.designation AS primary_stakeholder_designation
      FROM clients c
      LEFT JOIN stakeholders ps ON ps.id = c.primary_stakeholder_id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!client) return res.status(404).json({ success: false, message: "Client not found." });

    const [domains] = await db.execute(
      "SELECT id, domain FROM client_domains WHERE client_id = ? ORDER BY domain",
      [req.params.id]
    );

    const [departments] = await db.execute(
      "SELECT id, name FROM client_departments WHERE client_id = ? ORDER BY name",
      [req.params.id]
    );

    const [stakeholders] = await db.execute(`
      SELECT
        s.id, s.name, s.email, s.designation,
        s.level, s.dept_id, s.active,
        d.name AS dept_name
      FROM stakeholders s
      LEFT JOIN client_departments d ON d.id = s.dept_id
      WHERE s.client_id = ?
      ORDER BY s.level, s.name
    `, [req.params.id]);

    const [allocations] = await db.execute(`
      SELECT
        a.id, a.employee_id, a.dept_id,
        a.pct, a.start_date, a.end_date,
        e.name AS employee_name,
        e.code AS employee_code,
        e.role AS employee_role
      FROM employee_allocations a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.client_id = ? AND a.is_active = 1
    `, [req.params.id]);

    return res.json({ success: true, data: { ...client, domains, departments, stakeholders, allocations } });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── POST /api/clients ─────────────────────────────────────────────────────────
async function createClient(req, res, next) {
  const {
    code, name, industry, status, color_hex,
    pc_name, pc_email, pc_phone,
    notes,
  } = req.body;

  if (!code || !name) {
    return res.status(400).json({ success: false, message: "code and name are required." });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO clients
        (id, code, name, industry, status, color_hex,
         pc_name, pc_email, pc_phone, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        code, code, name, industry || null,
        status || "onboarding", color_hex || "#64748B",
        pc_name || null, pc_email || null, pc_phone || null,
        notes || null, req.admin.id,
      ]
    );
    return res.status(201).json({ success: true, message: "Client created.", id: code });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── PUT /api/clients/:id ──────────────────────────────────────────────────────
async function updateClient(req, res, next) {
  const { id } = req.params;
  const {
    name, industry, status, color_hex,
    primary_domain,
    primary_stakeholder_id,
    pc_name, pc_email, pc_phone, notes,
  } = req.body;

  try {
    if (primary_stakeholder_id) {
      const [[sh]] = await db.execute(
        "SELECT id FROM stakeholders WHERE id = ? AND client_id = ?",
        [primary_stakeholder_id, id]
      );
      if (!sh) {
        return res.status(400).json({ success: false, message: "primary_stakeholder_id does not belong to this client." });
      }
    }

    await db.execute(
      `UPDATE clients SET
        name                   = COALESCE(?, name),
        industry               = COALESCE(?, industry),
        status                 = COALESCE(?, status),
        color_hex              = COALESCE(?, color_hex),
        primary_domain         = COALESCE(?, primary_domain),
        primary_stakeholder_id = COALESCE(?, primary_stakeholder_id),
        pc_name                = COALESCE(?, pc_name),
        pc_email               = COALESCE(?, pc_email),
        pc_phone               = COALESCE(?, pc_phone),
        notes                  = COALESCE(?, notes),
        updated_at             = NOW()
       WHERE id = ?`,
      [name ?? null, industry ?? null, status ?? null, color_hex ?? null,
       primary_domain || null, primary_stakeholder_id || null,
       pc_name ?? null, pc_email ?? null, pc_phone ?? null, notes ?? null, id]
    );
    return res.json({ success: true, message: "Client updated." });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── DELETE /api/clients/:id ───────────────────────────────────────────────────
async function deleteClient(req, res, next) {
  const { id } = req.params;
  try {
    const [[{ count }]] = await db.execute(
      "SELECT COUNT(*) AS count FROM employee_allocations WHERE client_id = ? AND is_active = 1", [id]
    );
    if (count > 0) {
      return res.status(409).json({ success: false, message: "Cannot remove client with active resource allocations." });
    }
    await db.execute("UPDATE clients SET status = 'inactive', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: "Client deactivated." });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── PUT /api/clients/:id/primary-stakeholder ──────────────────────────────────
async function setPrimaryStakeholder(req, res, next) {
  const { id } = req.params;
  const { stakeholder_id } = req.body;
  if (!stakeholder_id) return res.status(400).json({ success: false, message: "stakeholder_id is required." });

  try {
    const [[sh]] = await db.execute(
      "SELECT id, name FROM stakeholders WHERE id = ? AND client_id = ? AND active = 1",
      [stakeholder_id, id]
    );
    if (!sh) return res.status(400).json({ success: false, message: "Stakeholder not found or does not belong to this client." });

    await db.execute(
      "UPDATE clients SET primary_stakeholder_id = ?, updated_at = NOW() WHERE id = ?",
      [stakeholder_id, id]
    );
    return res.json({
      success: true,
      message: `Primary stakeholder set to ${sh.name}.`,
      primary_stakeholder_id: stakeholder_id,
    });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── GET /api/clients/:id/domains ─────────────────────────────────────────────
async function listDomains(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT id, domain FROM client_domains WHERE client_id = ? ORDER BY domain",
      [req.params.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── POST /api/clients/:id/domains ─────────────────────────────────────────────
async function addDomain(req, res, next) {
  const { id } = req.params;
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ success: false, message: "domain is required." });
  try {
    const [result] = await db.execute(
      "INSERT INTO client_domains (client_id, domain) VALUES (?, ?)",
      [id, domain.trim().toLowerCase()]
    );
    return res.status(201).json({ success: true, id: result.insertId, domain: domain.trim().toLowerCase() });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── DELETE /api/clients/:id/domains/:domainId ─────────────────────────────────
async function removeDomain(req, res, next) {
  const { id, domainId } = req.params;
  try {
    await db.execute("DELETE FROM client_domains WHERE id = ? AND client_id = ?", [domainId, id]);
    return res.json({ success: true, message: "Domain removed." });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── POST /api/clients/:id/departments ─────────────────────────────────────────
async function addDepartment(req, res, next) {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name is required." });
  try {
    const [existing] = await db.execute(
      "SELECT id FROM client_departments WHERE id REGEXP '^D[0-9]+$' ORDER BY CAST(SUBSTRING(id,2) AS UNSIGNED) DESC LIMIT 1"
    );
    const maxNum = existing.length ? parseInt(existing[0].id.slice(1)) : 0;
    const deptId = `D${maxNum + 1}`;
    await db.execute(
      "INSERT INTO client_departments (id, client_id, name) VALUES (?, ?, ?)",
      [deptId, id, name.trim()]
    );
    return res.status(201).json({ success: true, id: deptId, name: name.trim() });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

// ── DELETE /api/clients/:id/departments/:deptId ───────────────────────────────
async function removeDepartment(req, res, next) {
  const { id, deptId } = req.params;
  try {
    // Promote any stakeholders assigned to this dept → client-level so they remain visible
    await db.execute(
      "UPDATE stakeholders SET level = 'client', dept_id = NULL WHERE dept_id = ? AND client_id = ?",
      [deptId, id]
    );
    await db.execute("DELETE FROM client_departments WHERE id = ? AND client_id = ?", [deptId, id]);
    return res.json({ success: true, message: "Department removed. Stakeholders promoted to client-level." });
  } catch (err) { console.error("[clientController]", err.message, err); next(err); }
}

module.exports = {
  listClients, getClient, createClient, updateClient, deleteClient, setPrimaryStakeholder,
  listDomains, addDomain, removeDomain,
  addDepartment, removeDepartment,
};
