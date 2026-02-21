import pool from "../db.js";

async function getTaskCompanyId(taskId) {
  const result = await pool.query(
    `SELECT c.company_id
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     WHERE t.task_id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function getByTaskId(taskId) {
  const result = await pool.query(
    `SELECT
       te.etc_id,
       te.task_id,
       te.company_id,
       te.etc_hours,
       te.created_at,
       te.updated_at
     FROM task_etc te
     WHERE te.task_id = $1`,
    [taskId]
  );
  return result.rows;
}

async function upsert(etcId, taskId, companyId, etcHours) {
  const result = await pool.query(
    `INSERT INTO task_etc (etc_id, task_id, company_id, etc_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (task_id)
     DO UPDATE SET
       etc_hours = $4,
       updated_at = NOW()
     RETURNING etc_id, task_id, company_id, etc_hours, created_at, updated_at`,
    [etcId, taskId, companyId, etcHours]
  );
  return result.rows[0];
}

async function getById(etcId) {
  const result = await pool.query(
    `SELECT te.etc_id, te.company_id
     FROM task_etc te
     WHERE te.etc_id = $1`,
    [etcId]
  );
  return result.rows[0] || null;
}

async function remove(etcId) {
  const result = await pool.query(
    `DELETE FROM task_etc
     WHERE etc_id = $1
     RETURNING etc_id`,
    [etcId]
  );
  return result.rows[0];
}

export {
  getTaskCompanyId,
  getByTaskId,
  upsert,
  getById,
  remove,
};

export default {
  getTaskCompanyId,
  getByTaskId,
  upsert,
  getById,
  remove,
};
