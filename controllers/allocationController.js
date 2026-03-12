// controllers/allocationController.js
// v3.0 — aligned with new schema:
//   allocations → employee_allocations
//   allocation_pct → pct  |  department_id → dept_id
//   allocation_stakeholders.review_pct → .pct
//   client.client_name → .name  |  e.first_name/last_name → e.name
const db = require("../config/db");

// ── GET /api/allocations ──────────────────────────────────────────────────────
async function listAllocations(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT
        e.id           AS employee_id,
        e.code         AS employee_code,
        e.name         AS employee_name,
        e.role         AS designation,
        e.active       AS employee_status,
        COALESCE(SUM(a.pct), 0)         AS total_allocation_pct,
        (100 - COALESCE(SUM(a.pct), 0)) AS leakage_pct,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'allocation_id', a.id,
            'client_id',     a.client_id,
            'client_name',   c.name,
            'color_hex',     c.color_hex,
            'dept_id',       a.dept_id,
            'dept_name',     d.name,
            'pct',           a.pct,
            'start_date',    a.start_date,
            'end_date',      a.end_date
          )
        ) AS allocations
      FROM employees e
      LEFT JOIN employee_allocations a ON a.employee_id = e.id AND a.is_active = 1
      LEFT JOIN clients              c ON c.id = a.client_id
      LEFT JOIN client_departments   d ON d.id = a.dept_id
      WHERE e.active = 1
      GROUP BY e.id
      ORDER BY leakage_pct DESC, e.name
    `);

    const data = await Promise.all(rows.map(async r => {
      const raw = typeof r.allocations === "string" ? JSON.parse(r.allocations || "[]") : (r.allocations || []);
      const allocs = raw.filter(a => a.allocation_id !== null);

      const enriched = await Promise.all(allocs.map(async a => {
        const [splits] = await db.execute(`
          SELECT
            als.stakeholder_id, als.pct AS review_pct,
            s.name AS stakeholder_name, s.email AS stakeholder_email
          FROM allocation_stakeholders als
          JOIN stakeholders s ON s.id = als.stakeholder_id
          WHERE als.allocation_id = ?
          ORDER BY als.pct DESC
        `, [a.allocation_id]);
        return { ...a, stakeholders: splits };
      }));

      return { ...r, allocations: enriched };
    }));

    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── GET /api/allocations/leakage ──────────────────────────────────────────────
async function getLeakage(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT
        e.id, e.code AS employee_code,
        e.name AS employee_name,
        e.role AS designation,
        COALESCE(SUM(a.pct), 0)         AS total_allocation_pct,
        (100 - COALESCE(SUM(a.pct), 0)) AS leakage_pct
      FROM employees e
      LEFT JOIN employee_allocations a ON a.employee_id = e.id AND a.is_active = 1
      WHERE e.active = 1
      GROUP BY e.id
      HAVING leakage_pct > 0
      ORDER BY leakage_pct DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── POST /api/allocations ─────────────────────────────────────────────────────
// Accepts batch format: { employee_id, allocations: [{clientId, deptId, pct, stakeholders:[{stakeholderId, pct}]}] }
// Replaces ALL existing active allocations for this employee atomically.
async function createAllocation(req, res, next) {
  const { employee_id, allocations } = req.body;

  if (!employee_id || !Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({ success: false, message: "employee_id and allocations array are required." });
  }

  // Validate total pct
  const totalPct = allocations.reduce((s, a) => s + Number(a.pct || 0), 0);
  if (totalPct > 100) {
    return res.status(400).json({ success: false, message: `Total allocation ${totalPct}% exceeds 100%.` });
  }

  // Validate each entry
  for (const a of allocations) {
    const clientId = a.clientId || a.client_id;
    const pct = Number(a.pct);
    if (!clientId || !pct || pct < 1 || pct > 100) {
      return res.status(400).json({ success: false, message: "Each allocation needs a valid clientId and pct (1–100)." });
    }
    if (a.stakeholders && a.stakeholders.length > 0) {
      const splitSum = a.stakeholders.reduce((s, x) => s + Number(x.pct || 0), 0);
      if (splitSum > Number(a.pct)) {
        return res.status(400).json({ success: false, message: `Stakeholder split (${splitSum}%) exceeds allocation pct (${a.pct}%) for client ${clientId}.` });
      }
    }
  }

  try {
    // Deactivate all existing allocations for this employee
    await db.execute(
      "UPDATE employee_allocations SET is_active = 0 WHERE employee_id = ?",
      [employee_id]
    );

    // Insert each new allocation
    const insertedIds = [];
    for (const a of allocations) {
      const clientId = a.clientId || a.client_id;
      const deptId = a.deptId || a.dept_id || null;
      const pct = Number(a.pct);
      const [result] = await db.execute(
        `INSERT INTO employee_allocations
           (employee_id, client_id, dept_id, pct, start_date, end_date, is_active, created_by)
         VALUES (?,?,?,?,?,?,1,?)`,
        [employee_id, clientId, deptId, pct,
          a.start_date || null, a.end_date || null, req.admin.id]
      );
      const allocationId = result.insertId;
      insertedIds.push(allocationId);

      // Insert stakeholder splits — frontend uses stakeholderId, also accept stakeholder_id
      if (Array.isArray(a.stakeholders) && a.stakeholders.length > 0) {
        for (const sp of a.stakeholders) {
          const shId = sp.stakeholderId || sp.stakeholder_id;
          if (!shId || !sp.pct) continue;
          await db.execute(
            "INSERT INTO allocation_stakeholders (allocation_id, stakeholder_id, pct, created_by) VALUES (?,?,?,?)",
            [allocationId, shId, Number(sp.pct), req.admin.id]
          );
        }
      }
    }

    return res.status(201).json({ success: true, message: "Allocations saved.", ids: insertedIds });
  } catch (err) { next(err); }
}

// ── PUT /api/allocations/:id ──────────────────────────────────────────────────
async function updateAllocation(req, res, next) {
  const { id } = req.params;
  const { pct, start_date, end_date, stakeholders } = req.body;

  try {
    await db.execute(
      `UPDATE employee_allocations SET
        pct        = COALESCE(?, pct),
        start_date = COALESCE(?, start_date),
        end_date   = COALESCE(?, end_date)
       WHERE id = ?`,
      [pct || null, start_date || null, end_date || null, id]
    );

    if (stakeholders !== undefined) {
      await db.execute("DELETE FROM allocation_stakeholders WHERE allocation_id = ?", [id]);
      if (stakeholders.length > 0) {
        await Promise.all(stakeholders.map(sp =>
          db.execute(
            "INSERT INTO allocation_stakeholders (allocation_id, stakeholder_id, pct, created_by) VALUES (?,?,?,?)",
            [id, sp.stakeholder_id, sp.pct, req.admin.id]
          )
        ));
      }
    }

    return res.json({ success: true, message: "Allocation updated." });
  } catch (err) { next(err); }
}

// ── DELETE /api/allocations/:id ───────────────────────────────────────────────
async function deleteAllocation(req, res, next) {
  try {
    await db.execute("UPDATE employee_allocations SET is_active = 0 WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Allocation removed." });
  } catch (err) { next(err); }
}

module.exports = { listAllocations, getLeakage, createAllocation, updateAllocation, deleteAllocation };