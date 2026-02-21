import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import timesheetController from "../controllers/timesheetController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.getTimesheets
);

router.post("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.saveTimesheet
);

router.delete("/:timesheet_id",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.deleteTimesheet
);

router.put("/submit",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.submitTimesheets
);

router.get("/max-submitted-date",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.getMaxSubmittedDate
);

router.get("/dates-with-timesheets",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.getDatesWithTimesheets
);

router.get("/snapshots",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.getSnapshots
);

router.get("/snapshots/:snapshot_id/details",
  verifyToken,
  checkRole(["PM", "USER", "ADMIN"]),
  timesheetController.getSnapshotDetails
);

router.get("/preview-submission",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.getPreviewSubmission
);

router.put("/snapshots/:snapshot_id/reopen",
  verifyToken,
  checkRole(["PM", "USER"]),
  timesheetController.reopenSnapshot
);

router.get("/tm-planning",
  verifyToken,
  checkRole(["PM"]),
  timesheetController.getTMPlanning
);

router.post("/tm-planning",
  verifyToken,
  checkRole(["PM"]),
  timesheetController.saveTimesheetForPM
);

export default router;
