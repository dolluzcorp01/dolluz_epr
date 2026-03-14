// controllers/emailTemplateController.js — NEW v3.0
// Serves and updates email templates + CC list from DB.
// Routes: GET/PUT /api/email-templates
//         GET/PUT /api/email-templates/:id
//         GET/POST/DELETE /api/email-templates/cc
const db = require("../config/db");

// ── GET /api/email-templates ──────────────────────────────────────────────────
async function listTemplates(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, subject, body, type FROM email_templates ORDER BY id"
    );
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── GET /api/email-templates/:id ─────────────────────────────────────────────
async function getTemplate(req, res, next) {
  try {
    const [[tpl]] = await db.execute(
      "SELECT id, name, subject, body, type FROM email_templates WHERE id = ?",
      [req.params.id]
    );
    if (!tpl) return res.status(404).json({ success: false, message: "Template not found." });
    return res.json({ success: true, data: tpl });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── PUT /api/email-templates/:id ──────────────────────────────────────────────
// Only subject and body are editable. name and type are system-controlled.
async function updateTemplate(req, res, next) {
  const { id } = req.params;
  const { subject, body } = req.body;
  if (!subject && !body) {
    return res.status(400).json({ success: false, message: "At least one of subject or body is required." });
  }
  try {
    await db.execute(
      `UPDATE email_templates SET
        subject = COALESCE(?, subject),
        body    = COALESCE(?, body)
       WHERE id = ?`,
      [subject || null, body || null, id]
    );
    return res.json({ success: true, message: "Template updated." });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── GET /api/email-templates/cc ───────────────────────────────────────────────
async function listCc(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, label, locked FROM cc_list ORDER BY locked DESC, email"
    );
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── POST /api/email-templates/cc ─────────────────────────────────────────────
async function addCc(req, res, next) {
  const { email, label } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "email is required." });
  try {
    const [result] = await db.execute(
      "INSERT INTO cc_list (email, label, locked) VALUES (?,?,0)",
      [email.toLowerCase().trim(), label || null]
    );
    return res.status(201).json({ success: true, message: "CC added.", id: result.insertId });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── DELETE /api/email-templates/cc/:id ───────────────────────────────────────
async function removeCc(req, res, next) {
  const { id } = req.params;
  try {
    const [[row]] = await db.execute("SELECT locked FROM cc_list WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ success: false, message: "CC entry not found." });
    if (row.locked) return res.status(403).json({ success: false, message: "This CC entry is locked and cannot be removed." });
    await db.execute("DELETE FROM cc_list WHERE id = ?", [id]);
    return res.json({ success: true, message: "CC removed." });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

module.exports = { listTemplates, getTemplate, updateTemplate, createTemplate, deleteTemplate, listCc, addCc, removeCc };

// ── POST /api/email-templates ─────────────────────────────────────────────────
async function createTemplate(req, res, next) {
  const { name, type, subject, body } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: "name and type are required." });
  try {
    const [result] = await db.execute(
      "INSERT INTO email_templates (name, type, subject, body, editable, system_tpl) VALUES (?,?,?,?,1,0)",
      [name, type, subject || "", body || ""]
    );
    return res.status(201).json({ success: true, message: "Template created.", id: result.insertId, data: { id: result.insertId } });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}

// ── DELETE /api/email-templates/:id ──────────────────────────────────────────
async function deleteTemplate(req, res, next) {
  const { id } = req.params;
  try {
    const [[row]] = await db.execute("SELECT system_tpl FROM email_templates WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ success: false, message: "Template not found." });
    if (row.system_tpl) return res.status(403).json({ success: false, message: "System templates cannot be deleted." });
    await db.execute("DELETE FROM email_templates WHERE id = ?", [id]);
    return res.json({ success: true, message: "Template deleted." });
  } catch (err) { console.error("[emailTemplateController]", err.message, err); next(err); }
}
