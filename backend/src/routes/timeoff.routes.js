import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import timeoffController from "../controllers/timeoffController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  timeoffController.getByDateRange
);

router.get("/types",
  verifyToken,
  checkRole(["PM", "USER"]),
  timeoffController.getTypes
);

router.get("/totals",
  verifyToken,
  checkRole(["PM", "USER"]),
  timeoffController.getTotals
);

router.get("/capacity-planning",
  verifyToken,
  checkRole(["PM"]),
  timeoffController.getForCapacityPlanning
);

router.get("/gantt-daily",
  verifyToken,
  checkRole(["PM"]),
  timeoffController.getGanttDaily
);

router.get("/company-plan",
  verifyToken,
  checkRole(["PM"]),
  timeoffController.getCompanyPlan
);

router.post("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  timeoffController.save
);

router.delete("/:time_off_id",
  verifyToken,
  checkRole(["PM", "USER"]),
  timeoffController.remove
);

export default router;
