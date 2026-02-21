import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import dashboardController from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/projects",
  verifyToken,
  checkRole(["PM"]),
  dashboardController.getProjects
);

router.get("/estimates",
  verifyToken,
  checkRole(["PM"]),
  dashboardController.getEstimates
);

router.get("/tm-activities",
  verifyToken,
  checkRole(["PM"]),
  dashboardController.getTMActivities
);

export default router;
