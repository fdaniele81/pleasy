import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import userController from "../controllers/userController.js";

const router = express.Router();

router.post("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  userController.create
);

router.put("/update/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  userController.update
);

router.put("/change-password",
  verifyToken,
  userController.changePassword
);

router.put("/reset-password/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  userController.resetPassword
);

router.delete("/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  userController.remove
);

export default router;
