import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import clientController from "../controllers/clientController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.getAll
);

router.get("/client_projects",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.getClientsWithProjects
);

router.post("/",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.create
);

router.put("/:client_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.update
);

router.delete("/:client_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.remove
);

router.get("/:client_id/phases-config",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.getPhasesConfig
);

router.put("/:client_id/phases-config",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.updatePhasesConfig
);

router.post("/:client_id/assign-user",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.assignUser
);

router.get("/:client_id/tm-details",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.getTMDetails
);

router.delete("/:client_id/unassign-user/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.unassignUser
);

router.post("/:client_id/assign-pm/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.assignPM
);

router.delete("/:client_id/unassign-pm/:user_id",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.unassignPM
);

router.put("/:client_id/tm-reconciliation",
  verifyToken,
  checkRole(["ADMIN", "PM"]),
  clientController.updateTMReconciliation
);

export default router;
