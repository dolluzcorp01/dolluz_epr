// routes/reviews.js — v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/reviewController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const { verifyStakeholderAuth } = require("../middleware/stakeholderAuth");
const auth = [verifyAdminToken, requirePasswordChanged];

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get   ("/",                    ...auth, ctrl.listReviews);
router.post  ("/bulk-request",        ...auth, requireRole("atLeast:sub_admin"), ctrl.bulkRequest);
router.post  ("/:id/send-email",      ...auth, requireRole("atLeast:sub_admin"), ctrl.sendReviewEmail);
router.post  ("/:id/remind",          ...auth, requireRole("atLeast:sub_admin"), ctrl.remindReview);
router.post  ("/:id/reactivate",      ...auth, requireRole("atLeast:sub_admin"), ctrl.reactivateReview);
router.put   ("/:id/approve",         ...auth, requireRole("atLeast:sub_admin"), ctrl.approveReview);
router.put   ("/:id",                 ...auth, requireRole("atLeast:sub_admin"), ctrl.updateReview);

// ── Stakeholder (OTP-auth) ────────────────────────────────────────────────────
router.get   ("/my",                  verifyStakeholderAuth, ctrl.getMyReviews);
router.get   ("/:id/form",            verifyStakeholderAuth, ctrl.getReviewForm);
router.post  ("/:id/submit",          verifyStakeholderAuth, ctrl.submitReview);

module.exports = router;
