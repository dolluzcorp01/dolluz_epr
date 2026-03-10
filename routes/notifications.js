const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/notificationController");
const { verifyAdminToken, requirePasswordChanged } = require("../middleware/auth");
const auth    = [verifyAdminToken, requirePasswordChanged];

router.get ("/",       ...auth, ctrl.listNotifications);
router.put ("/:id",    ...auth, ctrl.markRead);  // id can be "all"

module.exports = router;
