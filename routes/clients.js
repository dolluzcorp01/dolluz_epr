// routes/clients.js — v3.0
const express = require("express");
const router  = express.Router();
const clientCtrl = require("../controllers/clientController");
const shCtrl     = require("../controllers/stakeholderController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");
const auth = [verifyAdminToken, requirePasswordChanged];

// Client CRUD
router.get   ("/",                            ...auth, clientCtrl.listClients);
router.get   ("/:id",                         ...auth, clientCtrl.getClient);
router.post  ("/",                            ...auth, requireRole("atLeast:sub_admin"), clientCtrl.createClient);
router.put   ("/:id",                         ...auth, requireRole("atLeast:sub_admin"), clientCtrl.updateClient);
router.put   ("/:id/primary-stakeholder",     ...auth, requireRole("atLeast:sub_admin"), clientCtrl.setPrimaryStakeholder);
router.delete("/:id",                         ...auth, requireRole("super_admin"), clientCtrl.deleteClient);

// Stakeholder sub-routes
router.get   ("/:clientId/stakeholders",      ...auth, shCtrl.listStakeholders);
router.post  ("/:clientId/stakeholders",      ...auth, requireRole("atLeast:sub_admin"), shCtrl.createStakeholder);
router.put   ("/:clientId/stakeholders/:id",  ...auth, requireRole("atLeast:sub_admin"), shCtrl.updateStakeholder);
router.delete("/:clientId/stakeholders/:id",  ...auth, requireRole("atLeast:sub_admin"), shCtrl.deleteStakeholder);

module.exports = router;
