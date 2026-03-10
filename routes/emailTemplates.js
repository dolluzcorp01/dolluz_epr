// routes/emailTemplates.js — NEW v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/emailTemplateController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",         ...auth, ctrl.listTemplates);
router.get   ("/cc",       ...auth, ctrl.listCc);
router.post  ("/cc",       ...auth, requireRole("atLeast:sub_admin"), ctrl.addCc);
router.delete("/cc/:id",   ...auth, requireRole("atLeast:sub_admin"), ctrl.removeCc);
router.get   ("/:id",      ...auth, ctrl.getTemplate);
router.put   ("/:id",      ...auth, requireRole("super_admin"), ctrl.updateTemplate);

module.exports = router;
