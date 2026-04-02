import todoItemRepository from "../repositories/todoItemRepository.js";
import { serviceError } from "../utils/errorHandler.js";

async function getTodoItems(user) {
  return todoItemRepository.getTodoItems(user.user_id);
}

async function createTodoItem(data, user) {
  return todoItemRepository.createTodoItem({
    user_id: user.user_id,
    company_id: user.company_id,
    title: data.title,
    details: data.details,
    due_date: data.due_date,
    task_id: data.task_id,
  });
}

async function updateTodoItem(todoItemId, data, user) {
  const result = await todoItemRepository.updateTodoItem(todoItemId, user.user_id, data);
  if (!result) {
    throw serviceError("TODO_NOT_FOUND", "Todo item not found", 404);
  }
  return result;
}

async function toggleTodoItem(todoItemId, user) {
  const result = await todoItemRepository.toggleTodoItem(todoItemId, user.user_id);
  if (!result) {
    throw serviceError("TODO_NOT_FOUND", "Todo item not found", 404);
  }
  return result;
}

async function toggleInProgress(todoItemId, user) {
  const result = await todoItemRepository.toggleInProgress(todoItemId, user.user_id);
  if (!result) {
    throw serviceError("TODO_NOT_FOUND", "Todo item not found", 404);
  }
  return result;
}

async function deleteTodoItem(todoItemId, user) {
  const result = await todoItemRepository.deleteTodoItem(todoItemId, user.user_id);
  if (!result) {
    throw serviceError("TODO_NOT_FOUND", "Todo item not found", 404);
  }
  return result;
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
