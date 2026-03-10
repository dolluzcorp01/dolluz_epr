const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/allocationController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth    = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",          ...auth, ctrl.listAllocations);
router.get   ("/leakage",   ...auth, ctrl.getLeakage);
router.post  ("/",          ...auth, requireRole("atLeast:sub_admin"), ctrl.createAllocation);
router.put   ("/:id",       ...auth, requireRole("atLeast:sub_admin"), ctrl.updateAllocation);
router.delete("/:id",       ...auth, requireRole("atLeast:sub_admin"), ctrl.deleteAllocation);

module.exports = router;
