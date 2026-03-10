// routes/settings.js — v3.0
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/settingsController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",                           ...auth, ctrl.getSettings);
router.put   ("/",                           ...auth, requireRole("super_admin"), ctrl.updateSettings);
router.get   ("/profile",                    ...auth, ctrl.getProfile);
router.put   ("/profile",                    ...auth, ctrl.updateProfile);
router.get   ("/users",                      ...auth, requireRole("super_admin"), ctrl.listUsers);
router.post  ("/users",                      ...auth, requireRole("super_admin"), ctrl.createUser);
router.put   ("/users/:id",                  ...auth, requireRole("super_admin"), ctrl.updateUser);
router.delete("/users/:id",                  ...auth, requireRole("super_admin"), ctrl.deleteUser);
router.post  ("/users/:id/reset-password",   ...auth, requireRole("super_admin"), ctrl.resetUserPassword);
router.post  ("/users/:id/unlock",           ...auth, requireRole("super_admin"), ctrl.unlockUser);

module.exports = router;
