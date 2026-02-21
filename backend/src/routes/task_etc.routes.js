import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import taskEtcController from "../controllers/taskEtcController.js";

const router = express.Router();

router.get("/task/:task_id",
  verifyToken,
  checkRole(["ADMIN", "PM", "USER"]),
  taskEtcController.getByTaskId
);

router.post("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  taskEtcController.upsert
);

router.delete("/:etc_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  taskEtcController.remove
);

export default router;
