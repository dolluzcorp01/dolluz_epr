// controllers/emailDispatchController.js
// v3.0 — aligned with new schema:
//   cycle_stakeholder_dispatch → cycle_stakeholder_email_state
//   cycle_dispatch_logs → email_logs
//   dispatch_id → email_state_id
//   sent_by column removed from email_logs (not in new schema)
//   key format: "{cycleId}_{clientCode}_{stakeholderId}" matches INITIAL_EMAIL_STATE in UI
const db = require("../config/db");

// ── GET /api/email-dispatch/:cycleId ──────────────────────────────────────────
// Returns full dispatch state for a cycle matching cycleEmailState UI shape:
// { "CY001_CL001_S1": { requestAt, reminder1At, ..., logs: [...] } }
async function getDispatchState(req, res, next) {
  const { cycleId } = req.params;
  try {
    const [states] = await db.execute(`
      SELECT
        es.id, es.cycle_id, es.client_id, es.stakeholder_id,
        es.request_at, es.reminder1_at, es.reminder2_at, es.reminder3_at,
        c.code AS client_code,
        s.name AS stakeholder_name
      FROM cycle_stakeholder_email_state es
      JOIN clients     c ON c.id = es.client_id
      JOIN stakeholders s ON s.id = es.stakeholder_id
      WHERE es.cycle_id = ?
      ORDER BY es.client_id, es.stakeholder_id
    `, [cycleId]);

    const [logs] = await db.execute(`
      SELECT
        el.email_state_id,
        el.employee_id,
        e.name         AS employee_name,
        e.code         AS employee_code,
        el.email_type  AS type,
        el.sent_at     AS at
      FROM email_logs el
      JOIN employees e ON e.id = el.employee_id
      JOIN cycle_stakeholder_email_state es ON es.id = el.email_state_id
      WHERE es.cycle_id = ?
      ORDER BY el.sent_at
    `, [cycleId]);

    // Build keyed object matching UI cycleEmailState shape
    const state = {};
    for (const d of states) {
      const key = `${d.cycle_id}_${d.client_code}_${d.stakeholder_id}`;
      const dispatchLogs = logs
        .filter(l => l.email_state_id === d.id)
        .map(l => ({
          empId   : l.employee_code,
          empName : l.employee_name,
          type    : l.type,
          at      : l.at,
        }));

      state[key] = {
        requestAt   : d.request_at   || null,
        reminder1At : d.reminder1_at || null,
        reminder2At : d.reminder2_at || null,
        reminder3At : d.reminder3_at || null,
        logs        : dispatchLogs,
      };
    }

    return res.json({ success: true, data: state });
  } catch (err) { console.error("[emailDispatchController]", err.message, err); next(err); }
}

// ── POST /api/email-dispatch/send ─────────────────────────────────────────────
// Records an email send event (request or reminder).
// Body: { cycle_id, client_id, stakeholder_id, email_type, employee_ids: [...] }
async function recordSend(req, res, next) {
  const { cycle_id, client_id, stakeholder_id, email_type, employee_ids } = req.body;

  if (!cycle_id || !client_id || !stakeholder_id || !email_type || !employee_ids) {
    return res.status(400).json({
      success: false,
      message: "cycle_id, client_id, stakeholder_id, email_type, employee_ids are all required.",
    });
  }

  const validTypes = ["request", "reminder1", "reminder2", "reminder3"];
  if (!validTypes.includes(email_type)) {
    return res.status(400).json({ success: false, message: `email_type must be one of: ${validTypes.join(", ")}.` });
  }

  try {
    const now = new Date();

    // Upsert email state header row
    const [existing] = await db.execute(
      "SELECT id FROM cycle_stakeholder_email_state WHERE cycle_id=? AND client_id=? AND stakeholder_id=?",
      [cycle_id, client_id, stakeholder_id]
    );

    let stateId;
    if (existing.length === 0) {
      const [ins] = await db.execute(
        "INSERT INTO cycle_stakeholder_email_state (cycle_id, client_id, stakeholder_id) VALUES (?,?,?)",
        [cycle_id, client_id, stakeholder_id]
      );
      stateId = ins.insertId;
    } else {
      stateId = existing[0].id;
    }

    // Stamp timestamp column on state header
    const col = {
      request   : "request_at",
      reminder1 : "reminder1_at",
      reminder2 : "reminder2_at",
      reminder3 : "reminder3_at",
    }[email_type];

    await db.execute(
      `UPDATE cycle_stakeholder_email_state SET ${col} = ? WHERE id = ?`,
      [now, stateId]
    );

    // Insert one email_logs row per employee
    await Promise.all(employee_ids.map(empId =>
      db.execute(
        "INSERT INTO email_logs (email_state_id, employee_id, email_type, sent_at) VALUES (?,?,?,?)",
        [stateId, empId, email_type, now]
      )
    ));

    return res.json({
      success     : true,
      message     : `${email_type} recorded for ${employee_ids.length} employee(s).`,
      state_id    : stateId,
      sent_at     : now,
    });
  } catch (err) { console.error("[emailDispatchController]", err.message, err); next(err); }
}

module.exports = { getDispatchState, recordSend };
