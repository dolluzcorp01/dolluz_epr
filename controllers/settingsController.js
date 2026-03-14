// controllers/settingsController.js
// v3.0 — aligned with new schema:
//   admin_users: avatar_initials (was avatar_letter), role column added via ALTER
const bcrypt = require("bcryptjs");
const db     = require("../config/db");
const { sendEmail } = require("../utils/emailSender");
const crypto = require("crypto");

// ── GET /api/settings ─────────────────────────────────────────────────────────
async function getSettings(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT setting_key, setting_value, category, description FROM system_settings ORDER BY category, setting_key"
    );
    const grouped = rows.reduce((acc, row) => {
      const cat = row.category || "general";
      if (!acc[cat]) acc[cat] = {};
      acc[cat][row.setting_key] = { value: row.setting_value, description: row.description };
      return acc;
    }, {});
    return res.json({ success: true, data: grouped });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── PUT /api/settings ─────────────────────────────────────────────────────────
async function updateSettings(req, res, next) {
  const { settings } = req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ success: false, message: "settings object is required." });
  }
  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const [key, value] of Object.entries(settings)) {
        await conn.execute(
          "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
          [String(value), key]
        );
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
    return res.json({ success: true, message: `${Object.keys(settings).length} setting(s) updated.` });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── GET /api/settings/users ───────────────────────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, email, role, designation, phone, timezone,
             avatar_initials, two_factor_enabled, is_active, last_login_at, created_at
      FROM admin_users
      ORDER BY role, name
    `);
    return res.json({ success: true, data: rows });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── POST /api/settings/users ──────────────────────────────────────────────────
async function createUser(req, res, next) {
  const { name, email, role, designation, phone, timezone } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: "name, email, and role are required." });
  }
  const validRoles = ["super_admin", "sub_admin", "hr_viewer", "viewer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `role must be one of: ${validRoles.join(", ")}` });
  }
  try {
    const tempPassword = `Dolluz@${new Date().getFullYear()}!${crypto.randomBytes(3).toString("hex")}`;
    const rounds       = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(tempPassword, rounds);
    const avatarInitials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();

    const [result] = await db.execute(`
      INSERT INTO admin_users
        (name, email, role, designation, phone, timezone,
         avatar_initials, password_hash, require_password_reset, is_active, created_by)
      VALUES (?,?,?,?,?,?,?,?,1,1,?)
    `, [name, email.toLowerCase().trim(), role, designation || null, phone || null,
        timezone || "Asia/Kolkata", avatarInitials, passwordHash, req.admin.id]);

    await sendEmail("welcome_user", email, {
      UserName     : name,
      UserEmail    : email,
      TempPassword : tempPassword,
      UserRole     : role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      PortalURL    : process.env.PORTAL_URL || "https://epr.dolluz.com/admin",
    });

    return res.status(201).json({ success: true, message: "User created. Welcome email sent.", id: result.insertId });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── PUT /api/settings/users/:id ───────────────────────────────────────────────
async function updateUser(req, res, next) {
  const { id } = req.params;
  const { name, role, designation, phone, timezone, is_active } = req.body;

  if (role && req.admin.role !== "super_admin") {
    return res.status(403).json({ success: false, message: "Only super_admin can change user roles." });
  }
  try {
    await db.execute(`
      UPDATE admin_users SET
        name        = COALESCE(?, name),
        role        = COALESCE(?, role),
        designation = COALESCE(?, designation),
        phone       = COALESCE(?, phone),
        timezone    = COALESCE(?, timezone),
        is_active   = COALESCE(?, is_active),
        updated_at  = NOW()
       WHERE id = ?
    `, [name, role, designation, phone, timezone, is_active !== undefined ? is_active : null, id]);
    return res.json({ success: true, message: "User updated." });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── DELETE /api/settings/users/:id ───────────────────────────────────────────
async function deleteUser(req, res, next) {
  if (parseInt(req.params.id) === req.admin.id) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account." });
  }
  try {
    await db.execute("UPDATE admin_users SET is_active = 0, updated_at = NOW() WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "User deactivated." });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── POST /api/settings/users/:id/reset-password ───────────────────────────────
async function resetUserPassword(req, res, next) {
  const { id } = req.params;
  try {
    const [[user]] = await db.execute("SELECT name, email FROM admin_users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const tempPassword = `Dolluz@${new Date().getFullYear()}!${crypto.randomBytes(3).toString("hex")}`;
    const rounds       = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(tempPassword, rounds);

    await db.execute(
      "UPDATE admin_users SET password_hash = ?, require_password_reset = 1, updated_at = NOW() WHERE id = ?",
      [passwordHash, id]
    );
    await sendEmail("welcome_user", user.email, {
      UserName     : user.name,
      UserEmail    : user.email,
      TempPassword : tempPassword,
      UserRole     : "Portal User",
      PortalURL    : process.env.PORTAL_URL || "https://epr.dolluz.com/admin",
    });
    return res.json({ success: true, message: "Password reset. New temporary password sent to user's email." });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── POST /api/settings/users/:id/unlock ──────────────────────────────────────
async function unlockUser(req, res, next) {
  try {
    await db.execute(
      "UPDATE admin_users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?",
      [req.params.id]
    );
    return res.json({ success: true, message: "Account unlocked." });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── GET /api/settings/profile ─────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const [[u]] = await db.execute(
      "SELECT id, name, email, role, designation, phone, timezone, avatar_initials FROM admin_users WHERE id = ?",
      [req.admin.id]
    );
    return res.json({ success: true, data: u });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

// ── PUT /api/settings/profile ─────────────────────────────────────────────────
async function updateProfile(req, res, next) {
  const { name, designation, phone, timezone } = req.body;
  try {
    const newInitials = name
      ? name.trim().split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase()
      : null;
    await db.execute(`
      UPDATE admin_users SET
        name            = COALESCE(?, name),
        designation     = COALESCE(?, designation),
        phone           = COALESCE(?, phone),
        timezone        = COALESCE(?, timezone),
        avatar_initials = COALESCE(?, avatar_initials),
        updated_at      = NOW()
       WHERE id = ?
    `, [name, designation, phone, timezone, newInitials, req.admin.id]);
    return res.json({ success: true, message: "Profile updated." });
  } catch (err) { console.error("[settingsController]", err.message, err); next(err); }
}

module.exports = {
  getSettings, updateSettings,
  listUsers, createUser, updateUser, deleteUser, resetUserPassword, unlockUser,
  getProfile, updateProfile,
};
