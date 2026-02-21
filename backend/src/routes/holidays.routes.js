import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import holidayController from "../controllers/holidayController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  holidayController.getAll
);

router.post("/",
  verifyToken,
  checkRole(["PM"]),
  holidayController.create
);

router.put("/:holiday_id",
  verifyToken,
  checkRole(["PM"]),
  holidayController.update
);

router.delete("/:holiday_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  holidayController.remove
);

export default router;
