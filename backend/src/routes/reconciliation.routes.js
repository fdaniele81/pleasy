import express from "express";
import multer from "multer";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import reconciliationController from "../controllers/reconciliationController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato file non valido. Usare file Excel (.xls, .xlsx)"));
    }
  },
});

router.get("/template",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.getTemplate
);

router.post("/upload",
  verifyToken,
  checkRole(["PM"]),
  upload.single("excelFile"),
  reconciliationController.uploadFile
);

router.post("/template",
  verifyToken,
  checkRole(["PM"]),
  upload.single("excelFile"),
  reconciliationController.configureTemplate
);

router.delete("/template",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.deleteTemplate
);

router.get("/sync-status",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.getSyncStatus
);

router.post("/preview-query",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.previewQuery
);

router.get("/preview-users",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.previewUsers
);

router.get("/preview-staging",
  verifyToken,
  checkRole(["PM"]),
  reconciliationController.previewStaging
);

export default router;
