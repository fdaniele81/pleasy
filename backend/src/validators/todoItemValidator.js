import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateCreateInput(data) {
  const { title, details, due_date, task_id } = data;

  if (!title || !title.trim()) {
    throw validationError("TODO_TITLE_REQUIRED", "Title is required");
  }

  if (task_id && !isValidUUID(task_id)) {
    throw validationError("TODO_INVALID_TASK_ID", "Invalid task_id");
  }

  return {
    title: title.trim(),
    details: details?.trim() || null,
    due_date: due_date || null,
    task_id: task_id || null,
  };
}

export function validateUpdateInput(data) {
  return validateCreateInput(data);
}

export function validateTodoItemId(todoItemId) {
  if (!todoItemId || !isValidUUID(todoItemId)) {
    throw validationError("TODO_INVALID_ID", "Invalid todo_item_id");
  }
  return todoItemId;
}

export default {
  validateCreateInput,
  validateUpdateInput,
  validateTodoItemId,
};
