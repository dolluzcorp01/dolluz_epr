// controllers/notificationController.js
const db = require("../config/db");

async function listNotifications(req, res, next) {
  const { unread_only, limit = 20 } = req.query;
  try {
    let where = unread_only === "true" ? "WHERE is_read = 0" : "";
    const [rows] = await db.execute(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    const [[{ unread }]] = await db.execute("SELECT COUNT(*) AS unread FROM notifications WHERE is_read = 0");
    return res.json({ success: true, data: rows, unreadCount: unread });
  } catch (err) { console.error("[notificationController]", err.message, err); next(err); }
}

async function markRead(req, res, next) {
  const { id } = req.params;
  try {
    if (id === "all") {
      await db.execute("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0");
    } else {
      await db.execute("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?", [id]);
    }
    return res.json({ success: true, message: "Notification(s) marked as read." });
  } catch (err) { console.error("[notificationController]", err.message, err); next(err); }
}

module.exports = { listNotifications, markRead };
