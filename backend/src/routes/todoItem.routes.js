import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import todoItemController from "../controllers/todoItemController.js";

const router = express.Router();

router.get("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.getTodoItems
);

router.post("/",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.createTodoItem
);

router.put("/:todo_item_id",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.updateTodoItem
);

router.put("/:todo_item_id/toggle",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.toggleTodoItem
);

router.put("/:todo_item_id/in-progress",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.toggleInProgress
);

router.delete("/:todo_item_id",
  verifyToken,
  checkRole(["PM", "USER"]),
  todoItemController.deleteTodoItem
);

export default router;
