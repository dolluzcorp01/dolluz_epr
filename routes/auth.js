const express    = require("express");
const rateLimit  = require("express-rate-limit");
const router     = express.Router();
const ctrl       = require("../controllers/authController");
const { verifyAdminToken } = require("../middleware/auth");

// Strict rate limit for OTP and login endpoints
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5,
  message  : { success: false, message: "Too many attempts. Please wait 15 minutes." },
  keyGenerator: (req) => req.body.email || req.ip,
});

// Admin authentication
router.post("/login",           authLimiter, ctrl.adminLogin);
router.post("/logout",          verifyAdminToken, ctrl.adminLogout);
router.post("/change-password", verifyAdminToken, ctrl.changePassword);
router.get ("/me",              verifyAdminToken, ctrl.getMe);

// Stakeholder OTP flow
router.post("/stakeholder/request-otp", authLimiter, ctrl.stakeholderRequestOtp);
router.post("/stakeholder/verify-otp",  authLimiter, ctrl.stakeholderVerifyOtp);

module.exports = router;
