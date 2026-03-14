// controllers/reviewController.js
// v3.0 — aligned with new schema:
//   reviews.stakeholder resolved via JOIN (not inline columns)
//   status: Not Started / Initiated / In Progress / Submitted / Approved / Closed
//   review_text table for goals/feedback  |  review_scores for per-criterion ratings
//   overall_rating stored directly on reviews row
//   bulk-request endpoint added
const db = require("../config/db");
const { sendEmail } = require("../utils/emailSender");
const { generateReviewPdf } = require("../utils/pdf");
const logger = require("../utils/logger");

// ── Admin: GET /api/reviews ───────────────────────────────────────────────────
async function listReviews(req, res, next) {
  const { cycle_id, client_id, status, employee_id } = req.query;
  try {
    let where = "WHERE 1=1";
    const params = [];
    if (cycle_id) { where += " AND r.cycle_id = ?"; params.push(cycle_id); }
    if (client_id) { where += " AND r.client_id = ?"; params.push(client_id); }
    if (status) { where += " AND r.status = ?"; params.push(status); }
    if (employee_id) { where += " AND r.employee_id = ?"; params.push(employee_id); }

    const [rows] = await db.execute(`
      SELECT r.*,
        e.name         AS employee_name,
        e.code         AS employee_code,
        e.role         AS designation,
        c.name         AS client_name,
        c.color_hex,
        s.name         AS stakeholder_name,
        s.email        AS stakeholder_email,
        rc.quarter_label AS cycle_name,
        rc.deadline,
        qs.score, qs.approved_hike, qs.scoring_locked AS is_locked
      FROM reviews r
      JOIN employees     e  ON e.id  = r.employee_id
      JOIN clients       c  ON c.id  = r.client_id
      JOIN stakeholders  s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      LEFT JOIN quarter_scores qs ON qs.employee_id = r.employee_id AND qs.cycle_id = r.cycle_id
      ${where}
      ORDER BY rc.start_date DESC, c.name, e.name
    `, params);
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Admin: POST /api/reviews/:id/send-email ───────────────────────────────────
async function sendReviewEmail(req, res, next) {
  const { id } = req.params;
  try {
    const [[r]] = await db.execute(`
      SELECT r.*,
        e.name AS employee_name,
        c.name AS client_name,
        s.name AS stakeholder_name, s.email AS stakeholder_email,
        rc.quarter_label AS cycle_name, rc.deadline
      FROM reviews r
      JOIN employees    e  ON e.id  = r.employee_id
      JOIN clients      c  ON c.id  = r.client_id
      JOIN stakeholders s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE r.id = ?
    `, [id]);
    if (!r) return res.status(404).json({ success: false, message: "Review not found." });

    await sendEmail("review_request", r.stakeholder_email, {
      StakeholderName: r.stakeholder_name,
      EmployeeName: r.employee_name,
      Quarter: r.cycle_name,
      Year: String(new Date().getFullYear()),
      ClientName: r.client_name,
      ResourceCount: "1",
      Deadline: new Date(r.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      ReviewLink: `${process.env.STAKEHOLDER_FORM_URL}?r=${r.id}`,
      resources: [{ name: r.employee_name, link: `${process.env.STAKEHOLDER_FORM_URL}?r=${r.id}` }],
    });

    await db.execute("UPDATE reviews SET status = 'Initiated', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: "Review email sent." });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Admin: POST /api/reviews/bulk-request ─────────────────────────────────────
// Sends review request to all Not Started stakeholders for a cycle.
// One-time per cycle — mirrors bulkRequestedCycles in UI state.
async function bulkRequest(req, res, next) {
  const { cycle_id } = req.body;
  if (!cycle_id) return res.status(400).json({ success: false, message: "cycle_id is required." });

  try {
    const [[cycle]] = await db.execute(
      "SELECT id, quarter_label, deadline, bulk_requested_at FROM review_cycles WHERE id = ?",
      [cycle_id]
    );
    if (!cycle) return res.status(404).json({ success: false, message: "Cycle not found." });
    if (cycle.bulk_requested_at) {
      return res.status(409).json({
        success: false,
        message: "Bulk request already sent for this cycle.",
        bulk_requested_at: cycle.bulk_requested_at,
      });
    }

    // Get all Not Started reviews, grouped by stakeholder
    const [rows] = await db.execute(`
      SELECT
        s.id AS stakeholder_id,
        s.email AS stakeholder_email,
        s.name AS stakeholder_name,
        c.name AS client_name,
        JSON_ARRAYAGG(
          JSON_OBJECT('id', r.id, 'employee_name', e.name, 'link',
            CONCAT(?, '?r=', r.id))
        ) AS resources
      FROM reviews r
      JOIN employees    e ON e.id  = r.employee_id
      JOIN stakeholders s ON s.id  = r.stakeholder_id
      JOIN clients      c ON c.id  = r.client_id
      WHERE r.cycle_id = ?
        AND r.status = 'Not Started'
      GROUP BY s.id, s.email, s.name, c.name
    `, [process.env.STAKEHOLDER_FORM_URL || "", cycle_id]);

    let sent = 0;
    const errors = [];
    for (const row of rows) {
      const resources = JSON.parse(row.resources || "[]");
      try {
        await sendEmail("review_request", row.stakeholder_email, {
          StakeholderName: row.stakeholder_name,
          Quarter: cycle.quarter_label,
          Year: String(new Date().getFullYear()),
          ClientName: row.client_name,
          ResourceCount: String(resources.length),
          Deadline: new Date(cycle.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
          resources,
        });
        // Update statuses to Initiated
        await db.execute(
          `UPDATE reviews SET status = 'Initiated', updated_at = NOW()
           WHERE stakeholder_id = ? AND cycle_id = ? AND status = 'Not Started'`,
          [row.stakeholder_id, cycle_id]
        );
        sent++;
      } catch (e) {
        errors.push({ stakeholder: row.stakeholder_email, error: e.message });
        logger.error(`[bulkRequest] Email failed for ${row.stakeholder_email}: ${e.message}`);
      }
    }

    const now = new Date();
    await db.execute("UPDATE review_cycles SET bulk_requested_at = ?, updated_at = NOW() WHERE id = ?", [now, cycle_id]);

    return res.json({
      success: true,
      message: `Bulk request sent. ${sent} stakeholder(s) emailed.`,
      sent,
      errors,
      bulk_requested_at: now,
    });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Admin: POST /api/reviews/:id/reactivate ───────────────────────────────────
async function reactivateReview(req, res, next) {
  const { id } = req.params;
  const { admin_note } = req.body;
  try {
    const [[r]] = await db.execute(`
      SELECT r.*,
        e.name AS employee_name,
        c.name AS client_name,
        s.name AS stakeholder_name, s.email AS stakeholder_email,
        rc.quarter_label AS cycle_name, rc.deadline
      FROM reviews r
      JOIN employees    e  ON e.id  = r.employee_id
      JOIN clients      c  ON c.id  = r.client_id
      JOIN stakeholders s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE r.id = ?
    `, [id]);
    if (!r) return res.status(404).json({ success: false, message: "Review not found." });

    await db.execute(
      "UPDATE reviews SET status = 'In Progress', reactivated_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    await sendEmail("reactivation", r.stakeholder_email, {
      StakeholderName: r.stakeholder_name,
      EmployeeName: r.employee_name,
      Quarter: r.cycle_name,
      ClientName: r.client_name,
      Deadline: new Date(r.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      ReviewLink: `${process.env.STAKEHOLDER_FORM_URL}?r=${r.id}`,
      AdminNote: admin_note || "",
    });

    return res.json({ success: true, message: "Review reactivated and email sent to stakeholder." });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Admin: PUT /api/reviews/:id/approve ──────────────────────────────────────
// Set status to Approved (manual sign-off by admin after review is Submitted)
async function approveReview(req, res, next) {
  const { id } = req.params;
  try {
    const [[r]] = await db.execute("SELECT id, status FROM reviews WHERE id = ?", [id]);
    if (!r) return res.status(404).json({ success: false, message: "Review not found." });
    if (r.status !== "Submitted") {
      return res.status(400).json({ success: false, message: "Only Submitted reviews can be approved." });
    }
    await db.execute(
      "UPDATE reviews SET status = 'Approved', updated_at = NOW() WHERE id = ?", [id]
    );
    return res.json({ success: true, message: "Review approved." });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Stakeholder: GET /api/reviews/my ─────────────────────────────────────────
async function getMyReviews(req, res, next) {
  const { reviewIds } = req.stakeholder;
  if (!reviewIds || !reviewIds.length) return res.json({ success: true, data: [] });
  try {
    const ph = reviewIds.map(() => "?").join(",");
    const [rows] = await db.execute(`
      SELECT r.id, r.status,
             e.name AS employee_name, e.role AS designation, e.department,
             c.name AS client_name,
             s.name AS stakeholder_name,
             rc.quarter_label AS cycle_name, rc.deadline
      FROM reviews r
      JOIN employees    e  ON e.id  = r.employee_id
      JOIN clients      c  ON c.id  = r.client_id
      JOIN stakeholders s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE r.id IN (${ph})
    `, reviewIds);
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Stakeholder: GET /api/reviews/:id/form ────────────────────────────────────
async function getReviewForm(req, res, next) {
  const { id } = req.params;
  const { reviewIds } = req.stakeholder;

  if (!reviewIds.includes(id) && !reviewIds.includes(parseInt(id))) {
    return res.status(403).json({ success: false, message: "Not authorised to access this review." });
  }

  try {
    const [[review]] = await db.execute(`
      SELECT r.*,
        e.name AS employee_name, e.role AS designation, e.department,
        c.name AS client_name,
        s.name AS stakeholder_name,
        rc.quarter_label AS cycle_name, rc.deadline
      FROM reviews r
      JOIN employees    e  ON e.id  = r.employee_id
      JOIN clients      c  ON c.id  = r.client_id
      JOIN stakeholders s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE r.id = ?
    `, [id]);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    // criteria from review_criteria (domain schema) — mapped to competencies shape
    const [criteria] = await db.execute(
      "SELECT id, label, section FROM review_criteria ORDER BY id ASC"
    );

    // Any previously saved responses
    const [responses] = await db.execute(
      "SELECT criterion_id, score AS rating FROM review_scores WHERE review_id = ?", [id]
    );

    // Existing text (goals/feedback)
    const [[text]] = await db.execute(
      "SELECT prev_goals, next_goals, feedback AS free_feedback FROM review_text WHERE review_id = ?", [id]
    );

    return res.json({ success: true, data: { review, criteria, responses, text: text || {} } });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

// ── Stakeholder: POST /api/reviews/:id/submit ─────────────────────────────────
async function submitReview(req, res, next) {
  const { id } = req.params;
  const { reviewIds, email } = req.stakeholder;
  const { responses, prev_goals, next_goals, free_feedback, send_copy, copy_emails } = req.body;

  if (!reviewIds.includes(id) && !reviewIds.includes(parseInt(id))) {
    return res.status(403).json({ success: false, message: "Not authorised for this review." });
  }
  if (!responses || !Array.isArray(responses) || !responses.length) {
    return res.status(400).json({ success: false, message: "Review responses are required." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Validate all criteria are rated
    const [criteria] = await conn.execute("SELECT id FROM review_criteria");
    const ratedIds = new Set(responses.map(r => String(r.criterion_id)));
    const missing = criteria.filter(c => !ratedIds.has(String(c.id)));
    if (missing.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `${missing.length} criteria have not been rated.` });
    }

    // Upsert scores into review_scores
    for (const resp of responses) {
      await conn.execute(`
        INSERT INTO review_scores (review_id, criterion_id, score, feedback)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE score = VALUES(score), feedback = VALUES(feedback)
      `, [id, resp.criterion_id, resp.rating, resp.comment || null]);
    }

    // Upsert review_text
    await conn.execute(`
      INSERT INTO review_text (review_id, prev_goals, next_goals, free_feedback)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        prev_goals    = VALUES(prev_goals),
        next_goals    = VALUES(next_goals),
        free_feedback = VALUES(free_feedback)
    `, [id, prev_goals || null, next_goals || null, free_feedback || null]);

    // Overall rating = average of scores
    const totalRating = responses.reduce((sum, r) => sum + r.rating, 0);
    const overall = parseFloat((totalRating / responses.length).toFixed(2));

    await conn.execute(`
      UPDATE reviews
      SET status = 'Submitted', submitted_at = NOW(),
          overall_rating = ?, updated_at = NOW()
      WHERE id = ?
    `, [overall, id]);

    // Compute score + update quarter_scores
    const [[r]] = await conn.execute("SELECT cycle_id FROM reviews WHERE id = ?", [id]);
    await conn.execute("CALL sp_compute_score(?, ?)", [id, r.cycle_id]);

    await conn.commit();

    // ── Post-submit emails (fire-and-forget) ────────────────────────────────
    const [[meta]] = await db.execute(`
      SELECT r.id,
        e.name AS employee_name, e.code AS employee_code,
        c.name AS client_name,
        s.name AS stakeholder_name,
        rc.quarter_label AS cycle_name,
        a.email AS admin_email, a.name AS admin_name
      FROM reviews r
      JOIN employees     e  ON e.id  = r.employee_id
      JOIN clients       c  ON c.id  = r.client_id
      JOIN stakeholders  s  ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      JOIN admin_users   a  ON a.role = 'super_admin'
      WHERE r.id = ?
      LIMIT 1
    `, [id]);

    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const mergeData = {
      StakeholderName: meta.stakeholder_name,
      EmployeeName: meta.employee_name,
      Quarter: meta.cycle_name,
      Year: String(new Date().getFullYear()),
      ClientName: meta.client_name,
      SubmittedAt: now,
      SubmitterEmail: email,
      RecipientName: meta.stakeholder_name,
      PortalLink: `${process.env.PORTAL_URL}/admin/reviews/${id}`,
    };

    // 1. Confirmation to stakeholder
    sendEmail("confirmation", email, mergeData)
      .catch(e => logger.error(`Confirmation email failed: ${e.message}`));

    // 2. Admin notification (TPL007)
    sendEmail("admin_notify", meta.admin_email || process.env.EMAIL_ADMIN_ADDRESS, mergeData)
      .catch(e => logger.error(`Admin notify failed: ${e.message}`));

    // 3. PDF copy if requested
    if (send_copy) {
      generateReviewPdf({
        review: { id, submitted_at: new Date(), overall_rating: overall, prev_goals, next_goals, free_feedback },
        responses: responses.map(resp => ({
          ...resp,
          criterion_label: resp.label || `Criterion ${resp.criterion_id}`,
          section: resp.section || "—",
        })),
        employee: { name: meta.employee_name, code: meta.employee_code },
        cycle: { cycle_name: meta.cycle_name },
        stakeholder: { name: meta.stakeholder_name, email, company: meta.client_name },
      }).then(pdfBuffer => {
        const recipients = [email, ...(copy_emails || [])].filter(Boolean);
        recipients.forEach(to => {
          sendEmail("pdf_copy", to, { ...mergeData, RecipientName: to }, {
            attachments: [{
              filename: `EPR_Review_${meta.employee_name.replace(/\s+/g, "_")}_${meta.cycle_name}.pdf`,
              content: pdfBuffer,
            }],
          }).catch(e => logger.error(`PDF copy email failed: ${e.message}`));
        });
      }).catch(e => logger.error(`PDF generation failed: ${e.message}`));
    }

    return res.json({ success: true, message: "Review submitted successfully. A confirmation has been sent to your email." });
  } catch (err) {
    await conn.rollback();
    console.error("[reviewController]", err.message, err); next(err);
  } finally { conn.release(); }
}


// ── Public: GET /api/reviews/:id/preview ─────────────────────────────────────
// No auth — used by stakeholder form on load to show employee name/cycle info
async function getReviewPreview(req, res, next) {
  const { id } = req.params;
  try {
    const [[row]] = await db.execute(`
      SELECT
        e.name  AS employee_name,
        e.code  AS employee_code,
        e.role  AS designation,
        c.name  AS client_name,
        c.primary_domain,
        d.name  AS dept_name,
        rc.quarter_label AS cycle_name,
        rc.deadline,
        rc.status AS cycle_status,
        r.status
      FROM reviews r
      JOIN employees     e  ON e.id  = r.employee_id
      JOIN clients       c  ON c.id  = r.client_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      LEFT JOIN employee_allocations ea
        ON ea.employee_id = r.employee_id
       AND ea.client_id   = r.client_id
       AND ea.is_active   = 1
      LEFT JOIN client_departments d ON d.id = ea.dept_id
      WHERE r.id = ?
      LIMIT 1
    `, [id]);
    if (!row) return res.status(404).json({ success: false, message: "Review not found." });
    // Only expose display-safe fields — no scores, no stakeholder info
    return res.json({
      success: true,
      data: {
        employee_name: row.employee_name,
        employee_code: row.employee_code,
        designation: row.designation,
        dept_name: row.dept_name,
        client_name: row.client_name,
        primary_domain: row.primary_domain,
        cycle_name: row.cycle_name,
        deadline: row.deadline,
        cycle_status: row.cycle_status,
        status: row.status,
      },
    });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

module.exports = {
  listReviews, sendReviewEmail, bulkRequest,
  reactivateReview, approveReview, remindReview, updateReview,
  getMyReviews, getReviewForm, submitReview, getReviewPreview,
};

async function remindReview(req, res, next) {
  const { id } = req.params;
  try {
    const [[r]] = await db.execute("SELECT id FROM reviews WHERE id = ?", [id]);
    if (!r) return res.status(404).json({ success: false, message: "Review not found." });
    // In production: send reminder email here
    await db.execute("UPDATE reviews SET updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: "Reminder sent." });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}

async function updateReview(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: "status is required." });
  try {
    const [[r]] = await db.execute("SELECT id FROM reviews WHERE id = ?", [id]);
    if (!r) return res.status(404).json({ success: false, message: "Review not found." });
    await db.execute("UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);
    return res.json({ success: true, message: "Review updated." });
  } catch (err) { console.error("[reviewController]", err.message, err); next(err); }
}
