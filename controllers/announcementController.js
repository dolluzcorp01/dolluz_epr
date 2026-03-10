// controllers/announcementController.js
const db = require("../config/db");

async function listAnnouncements(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT pa.*,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = pa.id) AS read_count
      FROM portal_announcements pa
      ORDER BY pa.created_at DESC
    `);

    const adminId = req.admin ? req.admin.id : null;
    const data = rows.map(r => ({
      ...r,
      is_read_by_me: false, // will resolve below
    }));

    if (adminId) {
      const [reads] = await db.execute(
        "SELECT announcement_id FROM announcement_reads WHERE admin_user_id = ?",
        [adminId]
      );
      const readSet = new Set(reads.map(r => r.announcement_id));
      data.forEach(r => { r.is_read_by_me = readSet.has(r.id); });
    }

    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function createAnnouncement(req, res, next) {
  const { title, body, type, expires_at } = req.body;
  if (!title || !body) return res.status(400).json({ success: false, message: "title and body are required." });
  try {
    const [result] = await db.execute(
      "INSERT INTO portal_announcements (title, body, type, expires_at, created_by) VALUES (?,?,?,?,?)",
      [title, body, type || "info", expires_at || null, req.admin.id]
    );
    return res.status(201).json({ success: true, message: "Announcement created.", id: result.insertId });
  } catch (err) { next(err); }
}

async function markAnnouncementRead(req, res, next) {
  const { id } = req.params;
  try {
    await db.execute(
      "INSERT IGNORE INTO announcement_reads (announcement_id, admin_user_id) VALUES (?,?)",
      [id, req.admin.id]
    );
    return res.json({ success: true });
  } catch (err) { next(err); }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await db.execute("DELETE FROM portal_announcements WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Announcement deleted." });
  } catch (err) { next(err); }
}

module.exports = { listAnnouncements, createAnnouncement, markAnnouncementRead, deleteAnnouncement };
