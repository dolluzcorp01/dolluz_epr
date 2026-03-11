// controllers/employeeController.js
// v3.0 — aligned with new schema:
//   employee_code → code  |  first_name/last_name → name
//   official_email → added via schema additions  |  status(ENUM) → active(TINYINT)
//   designation → role  |  base_ctc_usd → ctc
//   allocations → employee_allocations, allocation_pct → pct
const path   = require("path");
const fs     = require("fs");
const db     = require("../config/db");
const { importEmployees } = require("../utils/excel");
const logger = require("../utils/logger");

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

// ── GET /api/employees ────────────────────────────────────────────────────────
async function listEmployees(req, res, next) {
  const { search, active, department, client_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (e.name LIKE ? OR e.code LIKE ? OR e.official_email LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (active !== undefined) { where += " AND e.active = ?"; params.push(active); }
    if (department) { where += " AND e.department = ?"; params.push(department); }
    if (client_id) {
      where += " AND EXISTS (SELECT 1 FROM employee_allocations a WHERE a.employee_id = e.id AND a.client_id = ? AND a.is_active = 1)";
      params.push(client_id);
    }

    const limitInt  = parseInt(limit)  || 50;
    const offsetInt = parseInt(offset) || 0;

    const sql = `
      SELECT
        e.id, e.code, e.name, e.official_email, e.primary_phone,
        e.role, e.department, e.joining_date, e.active, e.ctc,
        e.reporting_manager,
        COALESCE(SUM(a.pct), 0) AS total_allocation_pct,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS client_names
      FROM employees e
      LEFT JOIN employee_allocations a ON a.employee_id = e.id AND a.is_active = 1
      LEFT JOIN clients c ON c.id = a.client_id
      ${where}
      GROUP BY e.id
      ORDER BY e.name
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `;

    const [rows]        = await db.execute(sql, params);
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM employees e ${where}`,
      params.slice(0, -2)
    );

    return res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) { next(err); }
}

// ── GET /api/employees/:id ────────────────────────────────────────────────────
async function getEmployee(req, res, next) {
  const { id } = req.params;
  try {
    const [[employee]] = await db.execute("SELECT * FROM employees WHERE id = ?", [id]);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });

    const [education]   = await db.execute("SELECT * FROM employee_education WHERE employee_id = ? ORDER BY end_year DESC", [id]);
    const [skills]      = await db.execute("SELECT skill_name, proficiency FROM employee_skills WHERE employee_id = ? ORDER BY skill_name", [id]);
    const [workHistory] = await db.execute("SELECT * FROM employee_work_history WHERE employee_id = ? ORDER BY end_date DESC", [id]);
    const [allocations] = await db.execute(`
      SELECT a.*, c.name AS client_name, c.color_hex,
             d.name AS dept_name
      FROM employee_allocations a
      JOIN clients c ON c.id = a.client_id
      LEFT JOIN client_departments d ON d.id = a.dept_id
      WHERE a.employee_id = ? AND a.is_active = 1
    `, [id]);

    return res.json({ success: true, data: { ...employee, education, skills, workHistory, allocations } });
  } catch (err) { next(err); }
}

// ── POST /api/employees ───────────────────────────────────────────────────────
async function createEmployee(req, res, next) {
  const d = req.body;
  const required = ["id", "code", "name", "role", "joining_date"];
  for (const field of required) {
    if (!d[field]) return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
  }

  try {
    await db.execute(`
      INSERT INTO employees (
        id, code, name, official_email, personal_email,
        primary_phone, secondary_phone, gender, dob, blood_group, nationality,
        aadhaar_number, pan_number, passport_number, passport_expiry,
        curr_addr_line1, curr_addr_line2, curr_addr_city, curr_addr_state, curr_addr_pincode,
        perm_addr_same_as_curr, perm_addr_line1, perm_addr_line2, perm_addr_city, perm_addr_state, perm_addr_pincode,
        ec_name, ec_relation, ec_phone, ec_email,
        role, department, joining_date, active, ctc,
        reporting_manager, internal_notes, created_by, updated_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      d.id, d.code, d.name,
      d.official_email || null, d.personal_email || null,
      d.primary_phone || null, d.secondary_phone || null,
      d.gender || null, d.dob || null, d.blood_group || null, d.nationality || null,
      d.aadhaar_number || null, d.pan_number || null, d.passport_number || null, d.passport_expiry || null,
      d.curr_addr_line1 || null, d.curr_addr_line2 || null, d.curr_addr_city || null, d.curr_addr_state || null, d.curr_addr_pincode || null,
      d.perm_addr_same_as_curr ? 1 : 0,
      d.perm_addr_line1 || null, d.perm_addr_line2 || null, d.perm_addr_city || null, d.perm_addr_state || null, d.perm_addr_pincode || null,
      d.ec_name || null, d.ec_relation || null, d.ec_phone || null, d.ec_email || null,
      d.role, d.department || null, d.joining_date,
      d.active !== undefined ? d.active : 1,
      d.ctc || null, d.reporting_manager || null, d.internal_notes || null,
      req.admin.id, req.admin.id,
    ]);
    return res.status(201).json({ success: true, message: "Employee created.", id: d.id });
  } catch (err) { next(err); }
}

// ── PUT /api/employees/:id ────────────────────────────────────────────────────
async function updateEmployee(req, res, next) {
  const { id } = req.params;
  const d = req.body;

  try {
    const [[exists]] = await db.execute("SELECT id FROM employees WHERE id = ?", [id]);
    if (!exists) return res.status(404).json({ success: false, message: "Employee not found." });

    const fields = [
      "name","official_email","personal_email","primary_phone","secondary_phone",
      "gender","dob","blood_group","nationality","aadhaar_number","pan_number",
      "passport_number","passport_expiry",
      "curr_addr_line1","curr_addr_line2","curr_addr_city","curr_addr_state","curr_addr_pincode",
      "perm_addr_same_as_curr","perm_addr_line1","perm_addr_line2","perm_addr_city","perm_addr_state","perm_addr_pincode",
      "ec_name","ec_relation","ec_phone","ec_email",
      "role","department","joining_date","active","ctc","reporting_manager","internal_notes",
    ];

    const updates = fields.filter(f => d[f] !== undefined);
    if (!updates.length) return res.status(400).json({ success: false, message: "No fields to update." });

    const setClauses = updates.map(f => `${f} = ?`).join(", ");
    const values     = updates.map(f => d[f]);
    values.push(req.admin.id, id);

    await db.execute(
      `UPDATE employees SET ${setClauses}, updated_by = ?, updated_at = NOW() WHERE id = ?`,
      values
    );
    return res.json({ success: true, message: "Employee updated." });
  } catch (err) { next(err); }
}

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────
async function deleteEmployee(req, res, next) {
  const { id } = req.params;
  try {
    await db.execute(
      "UPDATE employees SET active = 0, updated_by = ?, updated_at = NOW() WHERE id = ?",
      [req.admin.id, id]
    );
    return res.json({ success: true, message: "Employee deactivated." });
  } catch (err) { next(err); }
}

// ── POST /api/employees/import ────────────────────────────────────────────────
async function bulkImport(req, res, next) {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

  try {
    const { valid, errors, total } = importEmployees(req.file.buffer);
    let inserted = 0;
    const insertErrors = [];
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      for (const emp of valid) {
        try {
          // Map legacy import columns to new schema
          const empId   = emp.id || emp.employee_code || emp.code;
          const empCode = emp.code || emp.employee_code || empId;
          const empName = emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
          const empRole = emp.role || emp.designation;

          await conn.execute(`
            INSERT INTO employees
              (id, code, name, official_email, role, department, joining_date,
               primary_phone, gender, dob, ctc, reporting_manager, active, created_by, updated_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name), role = VALUES(role),
              department = VALUES(department), updated_by = VALUES(updated_by)
          `, [
            empId, empCode, empName,
            emp.official_email || emp.email || null,
            empRole, emp.department || null,
            emp.joining_date || null,
            emp.primary_phone || emp.phone || null,
            emp.gender || null, emp.dob || null,
            emp.ctc || emp.base_ctc_usd || null,
            emp.reporting_manager || null,
            req.admin.id, req.admin.id,
          ]);
          inserted++;
        } catch (rowErr) {
          insertErrors.push({ code: emp.code || emp.employee_code || "?", error: rowErr.message });
        }
      }

      await conn.execute(
        "INSERT INTO employee_import_logs (uploaded_by, filename, total_rows, success_rows, error_rows, errors_json) VALUES (?,?,?,?,?,?)",
        [req.admin.id, req.file.originalname, total, inserted, errors.length + insertErrors.length,
         JSON.stringify([...errors, ...insertErrors])]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally { conn.release(); }

    return res.json({
      success: true,
      message: `Import complete. ${inserted} record(s) upserted.`,
      total, inserted,
      parseErrors: errors,
      insertErrors,
    });
  } catch (err) { next(err); }
}

// ── POST /api/employees/:id/resume ────────────────────────────────────────────
async function uploadResume(req, res, next) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
  try {
    await db.execute(
      "UPDATE employees SET resume_file_path = ?, resume_original_name = ?, updated_by = ? WHERE id = ?",
      [req.file.path, req.file.originalname, req.admin.id, id]
    );
    return res.json({ success: true, message: "Resume uploaded.", path: req.file.path });
  } catch (err) { next(err); }
}

// ── GET /api/employees/:id/resume ─────────────────────────────────────────────
async function downloadResume(req, res, next) {
  const { id } = req.params;
  try {
    const [[emp]] = await db.execute(
      "SELECT resume_file_path, resume_original_name FROM employees WHERE id = ?", [id]
    );
    if (!emp || !emp.resume_file_path) return res.status(404).json({ success: false, message: "No resume on file." });
    if (!fs.existsSync(emp.resume_file_path)) return res.status(404).json({ success: false, message: "Resume file not found on disk." });
    res.download(emp.resume_file_path, emp.resume_original_name);
  } catch (err) { next(err); }
}

module.exports = {
  listEmployees, getEmployee, createEmployee, updateEmployee,
  deleteEmployee, bulkImport, uploadResume, downloadResume,
};
