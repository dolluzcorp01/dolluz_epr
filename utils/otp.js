// ─────────────────────────────────────────────────────────────────────────────
//  utils/otp.js
//  OTP generation and bcrypt-based verification.
//  OTPs are hashed before storage — never stored in plain text.
// ─────────────────────────────────────────────────────────────────────────────

const crypto  = require("crypto");
const bcrypt  = require("bcryptjs");

const OTP_LENGTH  = parseInt(process.env.OTP_LENGTH)        || 6;
const ROUNDS      = parseInt(process.env.BCRYPT_ROUNDS)     || 12;
const EXPIRY_MINS = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Generate a numeric OTP string of OTP_LENGTH digits.
 */
function generateOtp() {
  const max = Math.pow(10, OTP_LENGTH);
  const raw = crypto.randomInt(0, max);
  return String(raw).padStart(OTP_LENGTH, "0");
}

/**
 * Hash an OTP for safe DB storage.
 */
async function hashOtp(otp) {
  return bcrypt.hash(otp, ROUNDS);
}

/**
 * Verify a plain OTP against a stored hash.
 */
async function verifyOtp(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Return the OTP expiry timestamp (UTC Date object).
 */
function otpExpiresAt() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + EXPIRY_MINS);
  return d;
}

module.exports = { generateOtp, hashOtp, verifyOtp, otpExpiresAt, EXPIRY_MINS };
