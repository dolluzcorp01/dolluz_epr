// controllers/authController.js
// v3.0 — aligned with new schema:
//   reviews.status: pending→Not Started, opened→In Progress, submitted→Submitted
//   stakeholder email resolved via JOIN to stakeholders table (not inline columns)
//   admin_users: avatar_letter column (added via schema additions)
const bcrypt  = require("bcryptjs");
const db      = require("../config/db");
const { signAdminToken, signStakeholderToken } = require("../utils/jwt");
const { generateOtp, hashOtp, verifyOtp, otpExpiresAt } = require("../utils/otp");
const { sendEmail } = require("../utils/emailSender");
const logger  = require("../utils/logger");

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_MINS = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30;

// ── Admin: POST /api/auth/login ───────────────────────────────────────────────
async function adminLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }
  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, role, password_hash, is_active,
              failed_login_attempts, locked_until, require_password_reset,
              two_factor_enabled
       FROM admin_users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: "Invalid email or password." });

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: "Account deactivated. Contact your administrator." });

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(403).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINS * 60 * 1000);
        await db.execute("UPDATE admin_users SET failed_login_attempts=?, locked_until=? WHERE id=?", [attempts, lockedUntil, user.id]);
        return res.status(403).json({ success: false, message: `Account locked for ${LOCKOUT_MINS} minutes after too many failed attempts.` });
      }
      await db.execute("UPDATE admin_users SET failed_login_attempts=? WHERE id=?", [attempts, user.id]);
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    await db.execute(
      "UPDATE admin_users SET failed_login_attempts=0, locked_until=NULL, last_login_at=NOW(), last_login_ip=? WHERE id=?",
      [req.ip, user.id]
    );

    const token = signAdminToken({ id: user.id, email: user.email, role: user.role });
    return res.json({
      success: true, token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        requirePasswordReset: !!user.require_password_reset,
        twoFactorEnabled: !!user.two_factor_enabled,
      },
    });
  } catch (err) { next(err); }
}

// ── Admin: POST /api/auth/change-password ─────────────────────────────────────
async function changePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both currentPassword and newPassword are required." });
  }
  try {
    const [[u]] = await db.execute("SELECT password_hash FROM admin_users WHERE id=?", [req.admin.id]);
    if (!u) return res.status(404).json({ success: false, message: "User not found." });

    const match = await bcrypt.compare(currentPassword, u.password_hash);
    if (!match) return res.status(401).json({ success: false, message: "Current password is incorrect." });

    const [settings] = await db.execute(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('password_min_length','require_special_char','require_uppercase','require_number')"
    );
    const cfg = Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value]));

    const minLen = parseInt(cfg.password_min_length) || 8;
    if (newPassword.length < minLen) return res.status(400).json({ success: false, message: `Password must be at least ${minLen} characters.` });
    if (cfg.require_uppercase === "true" && !/[A-Z]/.test(newPassword)) return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter." });
    if (cfg.require_number === "true" && !/\d/.test(newPassword)) return res.status(400).json({ success: false, message: "Password must contain at least one number." });
    if (cfg.require_special_char === "true" && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) return res.status(400).json({ success: false, message: "Password must contain at least one special character." });

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hash   = await bcrypt.hash(newPassword, rounds);
    await db.execute(
      "UPDATE admin_users SET password_hash=?, require_password_reset=0, last_password_change_at=NOW() WHERE id=?",
      [hash, req.admin.id]
    );
    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) { next(err); }
}

// ── Admin: GET /api/auth/me ───────────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const [[u]] = await db.execute(
      "SELECT id, name, email, role, designation, phone, timezone, avatar_initials, two_factor_enabled, last_login_at FROM admin_users WHERE id=?",
      [req.admin.id]
    );
    if (!u) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user: u });
  } catch (err) { next(err); }
}

// ── Admin: POST /api/auth/logout ──────────────────────────────────────────────
function adminLogout(_req, res) {
  return res.json({ success: true, message: "Logged out successfully." });
}

// ── Stakeholder: POST /api/auth/stakeholder/request-otp ──────────────────────
async function stakeholderRequestOtp(req, res, next) {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "A valid email address is required." });
  }
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Validate domain against authorised client domains
    const domain = normalizedEmail.split("@")[1];
    const [domainCheck] = await db.execute(
      "SELECT cd.domain FROM client_domains cd WHERE cd.domain = ? LIMIT 1", [domain]
    );
    if (!domainCheck.length) {
      return res.json({ success: true, message: "If this email is registered for pending reviews, an OTP has been sent." });
    }

    // Find pending reviews for this stakeholder email in the active cycle
    const [reviews] = await db.execute(`
      SELECT r.id, r.employee_id, r.client_id, r.cycle_id,
             e.name AS employee_name,
             c.name AS client_name,
             s.name AS stakeholder_name
      FROM reviews r
      JOIN employees    e  ON e.id = r.employee_id
      JOIN clients      c  ON c.id = r.client_id
      JOIN stakeholders s  ON s.id = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE s.email = ?
        AND r.status IN ('Not Started', 'Initiated')
        AND rc.status = 'Active'
    `, [normalizedEmail]);

    if (!reviews.length) {
      return res.json({ success: true, message: "If this email is registered for pending reviews, an OTP has been sent." });
    }

    const otp      = generateOtp();
    const otpHash  = await hashOtp(otp);
    const expiresAt = otpExpiresAt();

    await db.execute(`
      INSERT INTO stakeholder_otps (email, otp_hash, expires_at, attempts)
      VALUES (?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), attempts = 0
    `, [normalizedEmail, otpHash, expiresAt]);

    // Mark reviews as In Progress (form link opened)
    const reviewIds = reviews.map(r => r.id);
    await db.execute(
      `UPDATE reviews SET status = 'In Progress' WHERE id IN (${reviewIds.map(() => "?").join(",")})`,
      reviewIds
    );

    // Send OTP email
    await sendEmail("review_request", normalizedEmail, {
      StakeholderName : reviews[0].stakeholder_name || normalizedEmail,
      Quarter         : "Active Cycle",
      Year            : String(new Date().getFullYear()),
      ClientName      : reviews[0].client_name,
      ResourceCount   : String(reviews.length),
      Deadline        : "—",
      resources       : reviews.map(r => ({
        name : r.employee_name,
        link : `${process.env.STAKEHOLDER_FORM_URL}?r=${r.id}`,
      })),
    });

    const devData = process.env.NODE_ENV === "development" ? { _devOtp: otp } : {};
    return res.json({ success: true, message: "OTP sent. Check your email.", ...devData });
  } catch (err) { next(err); }
}

// ── Stakeholder: POST /api/auth/stakeholder/verify-otp ───────────────────────
async function stakeholderVerifyOtp(req, res, next) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required." });

  const normalizedEmail = email.toLowerCase().trim();
  try {
    const [rows] = await db.execute(
      "SELECT otp_hash, expires_at, attempts FROM stakeholder_otps WHERE email = ?",
      [normalizedEmail]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: "No OTP found. Please request a new one." });

    const record = rows[0];
    if (new Date(record.expires_at) < new Date()) {
      await db.execute("DELETE FROM stakeholder_otps WHERE email = ?", [normalizedEmail]);
      return res.status(401).json({ success: false, message: "OTP expired. Please request a new one." });
    }
    if (record.attempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many failed attempts. Please request a new OTP." });
    }

    const valid = await verifyOtp(otp, record.otp_hash);
    if (!valid) {
      await db.execute("UPDATE stakeholder_otps SET attempts = attempts + 1 WHERE email = ?", [normalizedEmail]);
      return res.status(401).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    // Get active reviews for this stakeholder
    const [reviews] = await db.execute(`
      SELECT r.id, r.client_id
      FROM reviews r
      JOIN stakeholders s   ON s.id  = r.stakeholder_id
      JOIN review_cycles rc ON rc.id = r.cycle_id
      WHERE s.email = ?
        AND r.status IN ('In Progress', 'Initiated', 'Not Started')
        AND rc.status = 'Active'
    `, [normalizedEmail]);

    const token = signStakeholderToken({
      email     : normalizedEmail,
      reviewIds : reviews.map(r => r.id),
      clientId  : reviews[0] ? reviews[0].client_id : null,
    });

    await db.execute("DELETE FROM stakeholder_otps WHERE email = ?", [normalizedEmail]);

    return res.json({
      success   : true,
      token,
      reviewIds : reviews.map(r => r.id),
    });
  } catch (err) { next(err); }
}

module.exports = { adminLogin, adminLogout, changePassword, getMe, stakeholderRequestOtp, stakeholderVerifyOtp };
