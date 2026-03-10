// routes/scoring.js — v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/scoringController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

router.get  ("/",                                  ...auth, ctrl.listScoring);
router.get  ("/competencies",                      ...auth, ctrl.listCompetencies);
router.put  ("/competencies/:id",                  ...auth, requireRole("super_admin"), ctrl.updateCompetency);
router.post ("/:employee_id/compute",              ...auth, requireRole("atLeast:sub_admin"), ctrl.computeScore);
router.put  ("/:employee_id/hike",                 ...auth, requireRole("atLeast:sub_admin"), ctrl.approveHike);
router.put  ("/:employee_id/lock",                 ...auth, requireRole("super_admin"), ctrl.lockScore);

module.exports = router;
