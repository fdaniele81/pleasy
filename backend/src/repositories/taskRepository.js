import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";
import { getCompanyIdFromProject, getCompanyIdFromUser } from "./baseRepository.js";

async function getProjectsWithTasks(user) {
  let query = `SELECT
     p.project_id,
     p.project_key,
     p.title as project_title,
     p.description as project_description,
     p.status_id,
     c.client_id,
     c.client_key,
     c.client_name,
     c.company_id,
     t.task_id,
     t.task_number,
     t.title as task_title,
     t.description as task_description,
     t.task_details,
     t.task_status_id,
     t.owner_id,
     t.budget,
     t.initial_actual,
     t.start_date,
     t.end_date,
     u.full_name as owner_name,
     u.email as owner_email
   FROM project p
   JOIN client c ON p.client_id = c.client_id
   LEFT JOIN task t ON t.project_id = p.project_id
   LEFT JOIN users u ON t.owner_id = u.user_id
   WHERE p.status_id != 'DELETED' AND c.status_id = 'ACTIVE'`;

  const queryParams = [];

  if (user.role_id === "PM") {
    query += ` AND c.company_id = $1`;
    queryParams.push(user.company_id);
  }

  query += ` ORDER BY c.client_name, p.project_key, t.task_number`;

  const result = await pool.query(query, queryParams);
  return result.rows;
}


async function getNextTaskNumber(projectId) {
  const result = await pool.query(
    `INSERT INTO task_sequence (project_id, last_task_number)
     VALUES ($1, 1)
     ON CONFLICT (project_id)
     DO UPDATE SET last_task_number = task_sequence.last_task_number + 1
     RETURNING last_task_number`,
    [projectId]
  );
  return result.rows[0].last_task_number;
}

async function create(data) {
  const task_id = uuidv4();
  const result = await pool.query(
    `INSERT INTO task
       (task_id, task_number, project_id, external_key, title, description, task_details, task_status_id, owner_id, budget, initial_actual, start_date, end_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     RETURNING task_id, task_number, project_id, external_key, title, description, task_details, task_status_id, owner_id, budget, initial_actual, start_date, end_date, created_at`,
    [
      task_id,
      data.task_number,
      data.project_id,
      data.external_key || null,
      data.title,
      data.description,
      data.task_details || null,
      data.task_status_id || "TODO",
      data.owner_id,
      data.budget,
      0.00,
      data.start_date,
      data.end_date
    ]
  );
  return { task: result.rows[0], task_id };
}

async function createTaskETC(taskId, companyId, budget) {
  const etc_id = uuidv4();
  await pool.query(
    `INSERT INTO task_etc (etc_id, task_id, company_id, etc_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [etc_id, taskId, companyId, budget]
  );
}

async function updateTaskETC(taskId, companyId, etcHours) {
  const etc_id = uuidv4();
  const result = await pool.query(
    `INSERT INTO task_etc (etc_id, task_id, company_id, etc_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (task_id)
     DO UPDATE SET
       etc_hours = $4,
       updated_at = NOW()
     RETURNING etc_id, task_id, company_id, etc_hours`,
    [etc_id, taskId, companyId, etcHours]
  );
  return result.rows[0];
}

async function findById(taskId) {
  const result = await pool.query(
    `SELECT t.*, c.company_id
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     WHERE t.task_id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function update(taskId, data) {
  const result = await pool.query(
    `UPDATE task SET
        title = $2,
        description = $3,
        task_details = $4,
        task_status_id = $5,
        owner_id = $6,
        budget = $7,
        start_date = $8,
        end_date = $9,
        external_key = $10,
        updated_at = NOW()
     WHERE task_id = $1
     RETURNING *`,
    [
      taskId,
      data.title,
      data.description,
      data.task_details,
      data.task_status_id,
      data.owner_id,
      data.budget,
      data.start_date,
      data.end_date,
      data.external_key
    ]
  );
  return result.rows[0] || null;
}

async function softDelete(taskId) {
  const result = await pool.query(
    `UPDATE task
     SET task_status_id = 'DELETED',
         updated_at = NOW()
     WHERE task_id = $1
     RETURNING task_id, task_number, title, task_status_id`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function findByOwnerAndProject(ownerId, projectId, excludeDeleted = false) {
  let query = `SELECT task_id, task_number, title, task_status_id, owner_id, start_date, end_date
     FROM task
     WHERE owner_id = $1 AND project_id = $2`;

  if (excludeDeleted) {
    query += ` AND task_status_id != 'DELETED'`;
  }

  const result = await pool.query(query, [ownerId, projectId]);
  return result.rows[0] || null;
}

async function updateStatus(taskId, statusId) {
  const result = await pool.query(
    `UPDATE task
     SET task_status_id = $2,
         updated_at = NOW()
     WHERE task_id = $1
     RETURNING task_id, task_number, title, task_status_id, owner_id, start_date, end_date`,
    [taskId, statusId]
  );
  return result.rows[0] || null;
}

async function getPMPlanningData(pmUserId, companyId) {
  const query = `
    SELECT
      p.project_id,
      p.project_key,
      p.title as project_title,
      p.description as project_description,
      p.status_id,
      p.project_type_id,
      p.created_at as project_created_at,
      c.client_id,
      c.client_key,
      c.client_name,
      c.color as client_color,
      t.task_id,
      t.task_number,
      t.external_key,
      t.title as task_title,
      t.description as task_description,
      t.task_status_id,
      t.owner_id,
      t.budget,
      t.initial_actual,
      t.start_date,
      t.end_date,
      owner.full_name as owner_name,
      owner.email as owner_email,
      etc.etc_hours,
      COALESCE(t.initial_actual, 0) + COALESCE(timesheet_sum.total_actual, 0) as actual_hours,
      COALESCE(non_submitted_sum.non_submitted_hours, 0) as non_submitted_hours
    FROM project_manager pm
    JOIN project p ON pm.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN task t ON t.project_id = p.project_id
    LEFT JOIN users owner ON t.owner_id = owner.user_id
    LEFT JOIN task_etc etc ON t.task_id = etc.task_id
    LEFT JOIN (
      SELECT t.task_id, SUM(t.total_hours) as total_actual
      FROM task_timesheet t
      JOIN timesheet_snapshot s on t.snapshot_id = s.snapshot_id
      WHERE s.is_submitted = true
      GROUP BY task_id
    ) timesheet_sum ON t.task_id = timesheet_sum.task_id
    LEFT JOIN (
      SELECT t.task_id, SUM(t.total_hours) as non_submitted_hours
      FROM task_timesheet t
      JOIN timesheet_snapshot s on t.snapshot_id = s.snapshot_id
      WHERE s.is_submitted = false
      GROUP BY task_id
    ) non_submitted_sum ON t.task_id = non_submitted_sum.task_id
    WHERE pm.user_id = $1
      AND c.company_id = $2
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
    ORDER BY c.client_name, p.project_key, t.task_number`;

  const result = await pool.query(query, [pmUserId, companyId]);
  return result.rows;
}

async function getAvailableUsers(companyId) {
  const result = await pool.query(
    `SELECT
       user_id,
       email,
       full_name,
       role_id
     FROM users
     WHERE company_id = $1
       AND status_id = 'ACTIVE'
       AND role_id IN ('PM', 'USER')
     ORDER BY full_name`,
    [companyId]
  );
  return result.rows;
}

async function updateInitialActual(taskId, initialActual) {
  const result = await pool.query(
    `UPDATE task
     SET initial_actual = $2,
         updated_at = NOW()
     WHERE task_id = $1
     RETURNING task_id, task_number, title, initial_actual, updated_at`,
    [taskId, initialActual]
  );
  return result.rows[0] || null;
}

async function getTaskDetailsFull(taskId) {
  const result = await pool.query(
    `SELECT
      t.task_id,
      t.task_number,
      t.external_key,
      t.title,
      t.description,
      t.task_details,
      t.task_status_id,
      t.owner_id,
      t.budget,
      t.initial_actual,
      t.start_date,
      t.end_date,
      t.created_at,
      t.updated_at,
      t.project_id,
      p.project_key,
      p.title as project_title,
      c.company_id,
      c.client_name,
      owner.full_name as owner_name,
      owner.email as owner_email
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     LEFT JOIN users owner ON t.owner_id = owner.user_id
     WHERE t.task_id = $1 AND t.task_status_id != 'DELETED'`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function getTaskDetailsUser(taskId) {
  const result = await pool.query(
    `SELECT
      t.task_id,
      t.task_number,
      t.title,
      t.description,
      t.task_details,
      t.owner_id,
      p.project_key,
      p.title as project_title,
      c.company_id,
      c.client_name
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     WHERE t.task_id = $1 AND t.task_status_id != 'DELETED'`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function updateTaskDetails(taskId, taskDetails) {
  const result = await pool.query(
    `UPDATE task
     SET task_details = $2,
         updated_at = NOW()
     WHERE task_id = $1
     RETURNING task_id, task_number, title, task_details, updated_at`,
    [taskId, taskDetails || null]
  );
  return result.rows[0] || null;
}

async function getFTEReportTasks(companyId, startDate, endDate) {
  const query = `
    SELECT
      t.task_id,
      t.task_number,
      t.title as task_title,
      t.start_date,
      t.end_date,
      t.owner_id,
      p.project_id,
      p.project_key,
      p.project_type_id,
      p.title as project_title,
      c.client_id,
      c.client_name,
      owner.full_name as owner_name,
      owner.email as owner_email,
      CASE WHEN p.project_type_id = 'PROJECT' THEN etc.etc_hours
     ELSE COALESCE(tm_etc.tm_etc_hours, 0) END as etc_hours
    FROM task t
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN users owner ON t.owner_id = owner.user_id
    LEFT JOIN task_etc etc ON t.task_id = etc.task_id
    LEFT JOIN (
                SELECT tt.task_id, COALESCE(SUM(tt.total_hours), 0) as tm_etc_hours
                FROM task_timesheet tt
                WHERE tt.snapshot_id IS NULL
                  AND tt.timesheet_date >= CURRENT_DATE
                GROUP BY tt.task_id
              ) tm_etc ON t.task_id = tm_etc.task_id
    WHERE c.company_id = $1
      AND t.task_status_id != 'DELETED'
      AND t.start_date IS NOT NULL
      AND t.end_date IS NOT NULL
      AND ((p.project_type_id = 'PROJECT' and etc.etc_hours > 0) or p.project_type_id = 'TM')
      AND t.start_date <= $3
      AND t.end_date >= $2
      AND c.status_id = 'ACTIVE'
      AND p.status_id = 'ACTIVE'
    ORDER BY c.client_name, p.project_key, t.task_number`;

  const result = await pool.query(query, [companyId, startDate, endDate]);
  return result.rows;
}

async function getTMTaskDailyHours(taskIds, startDate, endDate) {
  if (!taskIds || taskIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      tt.task_id,
      tt.timesheet_date,
      tt.total_hours
    FROM task_timesheet tt
    WHERE tt.task_id = ANY($1)
      AND tt.timesheet_date >= $2
      AND tt.timesheet_date <= $3
    ORDER BY tt.task_id, tt.timesheet_date`;

  const result = await pool.query(query, [taskIds, startDate, endDate]);
  return result.rows;
}

async function getHolidays(companyId) {
  const result = await pool.query(
    `SELECT date, is_recurring
     FROM holiday_calendar
     WHERE company_id = $1`,
    [companyId]
  );
  return result.rows;
}

async function getTimeOffs(companyId) {
  const result = await pool.query(
    `SELECT user_id, date, hours
     FROM user_time_off_plan
     WHERE company_id = $1`,
    [companyId]
  );
  return result.rows;
}

export {
  getProjectsWithTasks,
  getCompanyIdFromProject,
  getCompanyIdFromUser,
  getNextTaskNumber,
  create,
  createTaskETC,
  updateTaskETC,
  findById,
  findByOwnerAndProject,
  update,
  updateStatus,
  softDelete,
  getPMPlanningData,
  getAvailableUsers,
  updateInitialActual,
  getTaskDetailsFull,
  getTaskDetailsUser,
  updateTaskDetails,
  getFTEReportTasks,
  getTMTaskDailyHours,
  getHolidays,
  getTimeOffs,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};

export default {
  getProjectsWithTasks,
  getCompanyIdFromProject,
  getCompanyIdFromUser,
  getNextTaskNumber,
  create,
  createTaskETC,
  updateTaskETC,
  findById,
  findByOwnerAndProject,
  update,
  updateStatus,
  softDelete,
  getPMPlanningData,
  getAvailableUsers,
  updateInitialActual,
  getTaskDetailsFull,
  getTaskDetailsUser,
  updateTaskDetails,
  getFTEReportTasks,
  getTMTaskDailyHours,
  getHolidays,
  getTimeOffs,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
