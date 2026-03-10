// ─────────────────────────────────────────────────────────────────────────────
//  middleware/stakeholderAuth.js
//  Validates the short-lived JWT issued to stakeholders after OTP verification.
//  Attaches req.stakeholder = { email, reviewIds, clientId }
// ─────────────────────────────────────────────────────────────────────────────

const { verifyStakeholderToken } = require("../utils/jwt");

function verifyStakeholderAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Stakeholder authentication required." });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyStakeholderToken(token);
    req.stakeholder = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Review session expired. Please request a new OTP.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid stakeholder session token." });
  }
}

module.exports = { verifyStakeholderAuth };
