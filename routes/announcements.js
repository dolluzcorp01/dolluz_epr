const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/announcementController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth    = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",        ...auth, ctrl.listAnnouncements);
router.post  ("/",        ...auth, requireRole("atLeast:sub_admin"), ctrl.createAnnouncement);
router.put   ("/:id/read",...auth, ctrl.markAnnouncementRead);
router.delete("/:id",     ...auth, requireRole("super_admin"), ctrl.deleteAnnouncement);

module.exports = router;
