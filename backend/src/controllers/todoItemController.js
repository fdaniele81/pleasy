import todoItemService from "../services/todoItemService.js";
import todoItemValidator from "../validators/todoItemValidator.js";
import { handleError } from "../utils/errorHandler.js";

async function getTodoItems(req, res) {
  try {
    const items = await todoItemService.getTodoItems(req.user);
    res.status(200).json({ items });
  } catch (err) {
    handleError(res, err, "GET TODO ITEMS ERR");
  }
}

async function createTodoItem(req, res) {
  try {
    const data = todoItemValidator.validateCreateInput(req.body);
    const item = await todoItemService.createTodoItem(data, req.user);
    res.status(201).json({ message: "Todo item created", item });
  } catch (err) {
    handleError(res, err, "CREATE TODO ITEM ERR");
  }
}

async function updateTodoItem(req, res) {
  try {
    const todoItemId = todoItemValidator.validateTodoItemId(req.params.todo_item_id);
    const data = todoItemValidator.validateUpdateInput(req.body);
    const item = await todoItemService.updateTodoItem(todoItemId, data, req.user);
    res.status(200).json({ message: "Todo item updated", item });
  } catch (err) {
    handleError(res, err, "UPDATE TODO ITEM ERR");
  }
}

async function toggleTodoItem(req, res) {
  try {
    const todoItemId = todoItemValidator.validateTodoItemId(req.params.todo_item_id);
    const result = await todoItemService.toggleTodoItem(todoItemId, req.user);
    res.status(200).json({ message: "Todo item toggled", ...result });
  } catch (err) {
    handleError(res, err, "TOGGLE TODO ITEM ERR");
  }
}

async function toggleInProgress(req, res) {
  try {
    const todoItemId = todoItemValidator.validateTodoItemId(req.params.todo_item_id);
    const result = await todoItemService.toggleInProgress(todoItemId, req.user);
    res.status(200).json({ message: "Todo item in-progress toggled", ...result });
  } catch (err) {
    handleError(res, err, "TOGGLE IN-PROGRESS ERR");
  }
}

async function deleteTodoItem(req, res) {
  try {
    const todoItemId = todoItemValidator.validateTodoItemId(req.params.todo_item_id);
    await todoItemService.deleteTodoItem(todoItemId, req.user);
    res.status(200).json({ message: "Todo item deleted", todo_item_id: todoItemId });
  } catch (err) {
    handleError(res, err, "DELETE TODO ITEM ERR");
  }
}

export {
  getTodoItems,
  createTodoItem,
  updateTodoItem,
  toggleTodoItem,
  toggleInProgress,
  deleteTodoItem,
};

export default {
  getTodoItems,
  createTodoItem,
  updateTodoItem,
  toggleTodoItem,
  toggleInProgress,
  deleteTodoItem,
};
