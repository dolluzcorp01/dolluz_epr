// ─────────────────────────────────────────────────────────────────────────────
//  middleware/auth.js
//  Admin portal authentication middleware.
//
//  verifyAdminToken       — validates Bearer JWT, attaches req.admin
//  requireRole(...roles)  — role guard, call after verifyAdminToken
//
//  Role hierarchy (most to least privileged):
//    super_admin > sub_admin > hr_viewer > viewer
// ─────────────────────────────────────────────────────────────────────────────

const { verifyAdminToken: verifyToken } = require("../utils/jwt");
const db = require("../config/db");

// Role hierarchy for >= comparisons
const ROLE_RANK = { super_admin: 4, sub_admin: 3, hr_viewer: 2, viewer: 1 };

/**
 * Verify the admin Bearer JWT.
 * On success attaches decoded payload to req.admin.
 */
async function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);

    // Check account is still active (not locked/deleted since token was issued)
    const [rows] = await db.execute(
      "SELECT id, role, locked_until, require_password_reset FROM admin_users WHERE id = ? AND is_active = 1",
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: "Account not found or deactivated." });
    }

    const user = rows[0];
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ success: false, message: "Account temporarily locked due to failed login attempts." });
    }

    req.admin = { ...decoded, role: user.role, requirePasswordReset: !!user.require_password_reset };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired — please log in again.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid authentication token." });
  }
}

/**
 * Restrict a route to specific roles.
 * @param {...string} roles  Allowed role names, or use 'atLeast:sub_admin' syntax
 *
 * Examples:
 *   requireRole("super_admin")
 *   requireRole("super_admin", "sub_admin")
 *   requireRole("atLeast:sub_admin")  — sub_admin and above
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const userRole = req.admin.role;

    // Check atLeast: prefix
    const atLeast = roles.find(r => r.startsWith("atLeast:"));
    if (atLeast) {
      const minRole = atLeast.split(":")[1];
      if ((ROLE_RANK[userRole] || 0) >= (ROLE_RANK[minRole] || 99)) return next();
      return res.status(403).json({ success: false, message: `Requires at least ${minRole} privileges.` });
    }

    if (roles.includes(userRole)) return next();
    return res.status(403).json({ success: false, message: "Insufficient privileges for this action." });
  };
}

/**
 * Force a password change if require_password_reset is set.
 * Place after verifyAdminToken on all non-auth routes.
 */
function requirePasswordChanged(req, res, next) {
  if (req.admin && req.admin.requirePasswordReset) {
    return res.status(403).json({
      success: false,
      message: "You must change your temporary password before accessing the portal.",
      code: "PASSWORD_RESET_REQUIRED",
    });
  }
  next();
}

module.exports = { verifyAdminToken, requireRole, requirePasswordChanged };
