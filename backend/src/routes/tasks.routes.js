import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import taskController from "../controllers/taskController.js";

const router = express.Router();

router.get("/project_tasks",
  verifyToken,
  checkRole(["PM", "USER"]),
  taskController.getProjectTasks
);

router.get("/pm-planning",
  verifyToken,
  checkRole(["PM"]),
  taskController.getPMPlanning
);

router.get("/fte-report",
  verifyToken,
  checkRole(["PM"]),
  taskController.getFTEReport
);

router.post("/",
  verifyToken,
  checkRole(["PM"]),
  taskController.create
);

router.put("/:task_id",
  verifyToken,
  checkRole(["PM"]),
  taskController.update
);

router.delete("/:task_id",
  verifyToken,
  checkRole(["PM"]),
  taskController.remove
);

router.get("/:project_id/available-users",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  taskController.getAvailableUsers
);

router.put("/:task_id/initial-actual",
  verifyToken,
  checkRole(["PM"]),
  taskController.updateInitialActual
);

router.put("/:task_id/etc",
  verifyToken,
  checkRole(["PM"]),
  taskController.updateTaskETC
);

router.get("/:task_id/details",
  verifyToken,
  checkRole(["PM"]),
  taskController.getTaskDetails
);

router.get("/:task_id/task-details",
  verifyToken,
  checkRole(["USER", "PM"]),
  taskController.getUserTaskDetails
);

router.put("/:task_id/task-details",
  verifyToken,
  checkRole(["USER", "PM"]),
  taskController.updateUserTaskDetails
);

export default router;
