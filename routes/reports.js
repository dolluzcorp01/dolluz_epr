const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/reportController");
const { verifyAdminToken, requirePasswordChanged } = require("../middleware/auth");
const auth    = [verifyAdminToken, requirePasswordChanged];

router.get("/dashboard",          ...auth, ctrl.dashboardSummary);
router.get("/hike-history",       ...auth, ctrl.hikeHistory);
router.get("/client-performance", ...auth, ctrl.clientPerformance);
router.get("/export",             ...auth, ctrl.exportReport);

module.exports = router;
