import db from "../db.js";

async function getTodoItems(userId) {
  const query = `
    SELECT
      ti.todo_item_id,
      ti.title,
      ti.details,
      TO_CHAR(ti.due_date, 'YYYY-MM-DD') AS due_date,
      ti.task_id,
      ti.is_completed,
      ti.is_in_progress,
      ti.created_at,
      t.title AS task_title,
      p.project_key,
      c.client_id,
      c.client_key,
      c.client_name,
      c.color AS client_color,
      c.symbol_letter,
      c.symbol_bg_color,
      c.symbol_letter_color
    FROM todo_item ti
    LEFT JOIN task t ON ti.task_id = t.task_id
    LEFT JOIN project p ON t.project_id = p.project_id
    LEFT JOIN client c ON p.client_id = c.client_id
    WHERE ti.user_id = $1
    ORDER BY ti.due_date ASC NULLS LAST, ti.created_at ASC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
}

async function createTodoItem(data) {
  const query = `
    INSERT INTO todo_item (user_id, company_id, title, details, due_date, task_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING todo_item_id, title, details,
      TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
      task_id, is_completed, is_in_progress, created_at
  `;
  const result = await db.query(query, [
    data.user_id,
    data.company_id,
    data.title,
    data.details || null,
    data.due_date || null,
    data.task_id || null,
  ]);
  return result.rows[0];
}

async function updateTodoItem(todoItemId, userId, data) {
  const query = `
    UPDATE todo_item
    SET title = $1, details = $2, due_date = $3, task_id = $4, updated_at = NOW()
    WHERE todo_item_id = $5 AND user_id = $6
    RETURNING todo_item_id, title, details,
      TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
      task_id, is_completed, is_in_progress
  `;
  const result = await db.query(query, [
    data.title,
    data.details || null,
    data.due_date || null,
    data.task_id || null,
    todoItemId,
    userId,
  ]);
  return result.rows[0];
}

async function toggleTodoItem(todoItemId, userId) {
  const query = `
    UPDATE todo_item
    SET is_completed = NOT is_completed,
        is_in_progress = CASE WHEN NOT is_completed THEN FALSE ELSE is_in_progress END,
        updated_at = NOW()
    WHERE todo_item_id = $1 AND user_id = $2
    RETURNING todo_item_id, is_completed, is_in_progress
  `;
  const result = await db.query(query, [todoItemId, userId]);
  return result.rows[0];
}

async function toggleInProgress(todoItemId, userId) {
  const query = `
    UPDATE todo_item
    SET is_in_progress = NOT is_in_progress, updated_at = NOW()
    WHERE todo_item_id = $1 AND user_id = $2
    RETURNING todo_item_id, is_in_progress
  `;
  const result = await db.query(query, [todoItemId, userId]);
  return result.rows[0];
}

async function deleteTodoItem(todoItemId, userId) {
  const query = `
    DELETE FROM todo_item
    WHERE todo_item_id = $1 AND user_id = $2
    RETURNING todo_item_id
  `;
  const result = await db.query(query, [todoItemId, userId]);
  return result.rows[0];
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
