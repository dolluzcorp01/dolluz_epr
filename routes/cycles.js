// routes/cycles.js — v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/cycleController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",                  ...auth, ctrl.listCycles);
router.get   ("/:id",               ...auth, ctrl.getCycle);
router.post  ("/",                  ...auth, requireRole("atLeast:sub_admin"), ctrl.createCycle);
router.put   ("/:id",               ...auth, requireRole("atLeast:sub_admin"), ctrl.updateCycle);
router.post  ("/:id/activate",      ...auth, requireRole("super_admin"), ctrl.activateCycle);
router.post  ("/:id/close",         ...auth, requireRole("super_admin"), ctrl.closeCycle);
router.put   ("/:id/reminders",     ...auth, requireRole("atLeast:sub_admin"), ctrl.setReminders);
router.post  ("/:id/bulk-request",  ...auth, requireRole("atLeast:sub_admin"), ctrl.bulkRequest);

module.exports = router;
