import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import companyController from "../controllers/companyController.js";

const router = express.Router();

router.get("/company_users",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  companyController.getCompaniesWithUsers
);

router.post("/",
  verifyToken,
  checkRole(["ADMIN"]),
  companyController.create
);

router.put("/:company_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  companyController.update
);

router.delete("/:company_id",
  verifyToken,
  checkRole(["ADMIN"]),
  companyController.remove
);

export default router;
