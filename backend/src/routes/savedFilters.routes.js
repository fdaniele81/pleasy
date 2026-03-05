import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import savedFiltersController from "../controllers/savedFiltersController.js";

const router = Router();

router.get("/", verifyToken, savedFiltersController.getFilters);
router.post("/", verifyToken, savedFiltersController.saveFilter);
router.put("/:filterId", verifyToken, savedFiltersController.updateFilter);
router.delete("/:filterId", verifyToken, savedFiltersController.deleteFilter);

export default router;
