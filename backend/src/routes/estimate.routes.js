import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import estimateController from "../controllers/estimateController.js";

const router = express.Router();

router.post("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.create
);

router.get("/",
  verifyToken,
  checkRole(["ADMIN", "PM", "USER"]),
  estimateController.getAll
);

router.get("/:estimate_id",
  verifyToken,
  checkRole(["ADMIN", "PM", "USER"]),
  estimateController.getById
);

router.put("/:estimate_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.update
);

router.delete("/:estimate_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.remove
);

router.post("/:estimate_id/tasks",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.createTask
);

router.put("/:estimate_id/tasks/:task_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.updateTask
);

router.delete("/:estimate_id/tasks/:task_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.deleteTask
);

router.post("/:estimate_id/clone",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.clone
);

router.post("/:estimate_id/convert",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.convert
);

router.post("/:estimate_id/save-draft-project",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.saveDraftProject
);

router.get("/:estimate_id/draft-project",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.getDraftProject
);

router.post("/:estimate_id/convert-to-project",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  estimateController.convertToProject
);

router.post("/:estimate_id/calculate-fte",
  verifyToken,
  checkRole(["ADMIN", "PM", "USER"]),
  estimateController.calculateFTE
);

export default router;
