// routes/emailDispatch.js — v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/emailDispatchController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

router.get  ("/:cycleId", ...auth, ctrl.getDispatchState);
router.post ("/send",     ...auth, requireRole("atLeast:sub_admin"), ctrl.recordSend);

module.exports = router;
