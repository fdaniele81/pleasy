import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import projectController from "../controllers/projectController.js";

const router = express.Router();

router.post("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.create
);

router.put("/:project_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.update
);

router.delete("/:project_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.remove
);

router.post("/:project_id/managers/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.addManager
);

router.delete("/:project_id/managers/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.removeManager
);

router.get("/:project_id/managers",
  verifyToken,
  checkRole(["ADMIN", "PM", "USER"]),
  projectController.getManagers
);

router.put("/:project_id/managers",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.updateManagers
);

router.get("/:client_id/available-managers",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  projectController.getAvailableManagers
);

export default router;
