const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const router   = express.Router();
const ctrl     = require("../controllers/employeeController");
const { verifyAdminToken, requireRole, requirePasswordChanged } = require("../middleware/auth");

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const MAX_MB     = parseInt(process.env.MAX_FILE_SIZE_MB || 10);

// Resume upload — disk storage
const resumeStorage = multer.diskStorage({
  destination : (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename    : (_req, file, cb) => cb(null, `resume_${Date.now()}_${file.originalname}`),
});
const resumeUpload = multer({
  storage  : resumeStorage,
  limits   : { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error("Only PDF, DOC, and DOCX files are allowed for resumes."));
  },
});

// Excel import — memory storage (buffer passed directly to parser)
const xlsxUpload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ([".xlsx", ".xls"].includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error("Only Excel files (.xlsx, .xls) are supported for import."));
  },
});

const auth = [verifyAdminToken, requirePasswordChanged];

router.get   ("/",             ...auth, ctrl.listEmployees);
router.get   ("/:id",          ...auth, ctrl.getEmployee);
router.post  ("/",             ...auth, requireRole("atLeast:sub_admin"), ctrl.createEmployee);
router.put   ("/:id",          ...auth, requireRole("atLeast:sub_admin"), ctrl.updateEmployee);
router.delete("/:id",          ...auth, requireRole("super_admin"), ctrl.deleteEmployee);
router.post  ("/import",       ...auth, requireRole("atLeast:sub_admin"), xlsxUpload.single("file"), ctrl.bulkImport);
router.post  ("/:id/resume",   ...auth, requireRole("atLeast:sub_admin"), resumeUpload.single("file"), ctrl.uploadResume);
router.get   ("/:id/resume",   ...auth, ctrl.downloadResume);

module.exports = router;
