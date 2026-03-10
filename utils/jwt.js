// ─────────────────────────────────────────────────────────────────────────────
//  utils/jwt.js
//  Two separate JWT namespaces:
//    • Admin tokens   — long-lived, contains role + user id
//    • Stakeholder tokens — short-lived, scoped to a single review session
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

const ADMIN_SECRET       = process.env.JWT_ADMIN_SECRET       || "CHANGE_ME_ADMIN_SECRET";
const STAKEHOLDER_SECRET = process.env.JWT_STAKEHOLDER_SECRET || "CHANGE_ME_STAKEHOLDER_SECRET";
const ADMIN_EXPIRES      = process.env.JWT_ADMIN_EXPIRES_IN   || "8h";
const SH_EXPIRES         = process.env.JWT_STAKEHOLDER_EXPIRES_IN || "2h";

/**
 * Sign a token for an admin portal user.
 * @param {{ id, email, role }} payload
 */
function signAdminToken(payload) {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: ADMIN_EXPIRES });
}

/**
 * Sign a token for a stakeholder who passed OTP.
 * @param {{ email, reviewIds: number[], clientId: string }} payload
 */
function signStakeholderToken(payload) {
  return jwt.sign(payload, STAKEHOLDER_SECRET, { expiresIn: SH_EXPIRES });
}

/**
 * Verify an admin token. Throws if invalid / expired.
 */
function verifyAdminToken(token) {
  return jwt.verify(token, ADMIN_SECRET);
}

/**
 * Verify a stakeholder token. Throws if invalid / expired.
 */
function verifyStakeholderToken(token) {
  return jwt.verify(token, STAKEHOLDER_SECRET);
}

module.exports = {
  signAdminToken,
  signStakeholderToken,
  verifyAdminToken,
  verifyStakeholderToken,
};
