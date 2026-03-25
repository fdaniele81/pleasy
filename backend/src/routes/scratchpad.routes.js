import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import scratchpadController from "../controllers/scratchpadController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  scratchpadController.getScratchpad
);

router.put("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  scratchpadController.saveScratchpad
);

export default router;
