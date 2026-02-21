import pool from "../db.js";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";

async function getEstimateWithCompany(estimateId) {
  const result = await pool.query(
    `SELECT e.estimate_id, e.client_id, c.company_id
     FROM estimate e
     JOIN client c ON e.client_id = c.client_id
     WHERE e.estimate_id = $1`,
    [estimateId]
  );
  return result.rows[0];
}

async function findDraftByEstimateId(estimateId) {
  const result = await pool.query(
    'SELECT project_draft_id FROM project_draft WHERE estimate_id = $1 LIMIT 1',
    [estimateId]
  );
  return result.rows[0]?.project_draft_id;
}

async function updateProjectDraft(draftId, estimateId, data) {
  const { client_id, project_key, title, description, status_id, project_details } = data;
  const result = await pool.query(
    `UPDATE project_draft
     SET client_id = $1,
         project_key = $2,
         title = $3,
         description = $4,
         status_id = $5,
         project_details = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE project_draft_id = $7 AND estimate_id = $8
     RETURNING *`,
    [
      client_id,
      project_key,
      title,
      description,
      status_id,
      project_details ? JSON.stringify(project_details) : null,
      draftId,
      estimateId
    ]
  );
  return result.rows[0];
}

async function createProjectDraft(draftId, estimateId, data, userId) {
  const { client_id, project_key, title, description, status_id, project_details } = data;
  const result = await pool.query(
    `INSERT INTO project_draft (
      project_draft_id, estimate_id, client_id, project_key,
      title, description, status_id, project_details, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      draftId,
      estimateId,
      client_id,
      project_key,
      title,
      description,
      status_id,
      project_details ? JSON.stringify(project_details) : null,
      userId
    ]
  );
  return result.rows[0];
}

async function deleteTaskDrafts(projectDraftId) {
  await pool.query(
    'DELETE FROM task_draft WHERE project_draft_id = $1',
    [projectDraftId]
  );
}

async function createTaskDraft(taskDraftId, estimateId, projectDraftId, task, index, userId) {
  const result = await pool.query(
    `INSERT INTO task_draft (
      task_draft_id, estimate_id, project_draft_id, task_number,
      project_id, external_key, title, description, task_status_id,
      owner_id, budget, task_details, start_date, end_date,
      initial_actual, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      taskDraftId,
      estimateId,
      projectDraftId,
      task.task_number || (index + 1),
      task.project_id || null,
      task.external_key || null,
      task.title || null,
      task.description || null,
      task.task_status_id || null,
      task.owner_id || null,
      task.budget || null,
      task.task_details ? JSON.stringify(task.task_details) : null,
      task.start_date || null,
      task.end_date || null,
      task.initial_actual || 0,
      userId
    ]
  );
  return result.rows[0];
}

async function getProjectDraftById(projectDraftId) {
  const result = await pool.query(
    `SELECT pd.*, c.company_id, c.client_name, e.title as estimate_title
     FROM project_draft pd
     JOIN estimate e ON pd.estimate_id = e.estimate_id
     JOIN client c ON pd.client_id = c.client_id
     WHERE pd.project_draft_id = $1`,
    [projectDraftId]
  );
  return result.rows[0];
}

async function getTaskDrafts(projectDraftId) {
  const result = await pool.query(
    `SELECT td.*
     FROM task_draft td
     WHERE td.project_draft_id = $1
     ORDER BY td.task_number ASC`,
    [projectDraftId]
  );
  return result.rows;
}

async function getProjectDraftsByEstimateId(estimateId) {
  const result = await pool.query(
    `SELECT pd.*, c.client_name
     FROM project_draft pd
     JOIN client c ON pd.client_id = c.client_id
     WHERE pd.estimate_id = $1
     ORDER BY pd.created_at DESC`,
    [estimateId]
  );
  return result.rows;
}

async function getDraftCompanyId(projectDraftId) {
  const result = await pool.query(
    `SELECT pd.project_draft_id, c.company_id
     FROM project_draft pd
     JOIN client c ON pd.client_id = c.client_id
     WHERE pd.project_draft_id = $1`,
    [projectDraftId]
  );
  return result.rows[0];
}

async function deleteProjectDraft(projectDraftId) {
  await pool.query(
    'DELETE FROM project_draft WHERE project_draft_id = $1',
    [projectDraftId]
  );
}

async function checkProjectKeyExists(projectKey) {
  const result = await pool.query(
    `SELECT project_id FROM project WHERE project_key = $1`,
    [projectKey]
  );
  return result.rows[0]?.project_id || null;
}

async function getProjectWithTasksByKey(projectKey) {
  const projectResult = await pool.query(
    `SELECT p.project_id, p.project_key, p.title, p.status_id, p.client_id, c.client_name
     FROM project p
     JOIN client c ON p.client_id = c.client_id
     WHERE p.project_key = $1`,
    [projectKey]
  );
  if (projectResult.rows.length === 0) return null;

  const project = projectResult.rows[0];
  const tasksResult = await pool.query(
    `SELECT t.task_id, t.task_number, t.title, t.description, t.budget, t.task_status_id
     FROM task t
     WHERE t.project_id = $1
     ORDER BY t.task_number ASC`,
    [project.project_id]
  );

  return { ...project, tasks: tasksResult.rows };
}

async function createProject(projectId, clientId, projectKey, title, statusId) {
  const result = await pool.query(
    `INSERT INTO project (
      project_id, client_id, project_key, title, status_id,
      created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [projectId, clientId, projectKey, title, statusId || 'ACTIVE']
  );
  return result.rows[0];
}

async function addProjectManager(projectId, userId) {
  await pool.query(
    `INSERT INTO project_manager (project_id, user_id, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())`,
    [projectId, userId]
  );
}

async function getMaxTaskNumber(projectId) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(task_number), 0) as max_number FROM task WHERE project_id = $1`,
    [projectId]
  );
  return parseInt(result.rows[0].max_number, 10);
}

async function upsertTaskSequence(projectId, taskNumber) {
  await pool.query(
    `INSERT INTO task_sequence (project_id, last_task_number)
     VALUES ($1, $2)
     ON CONFLICT (project_id)
     DO UPDATE SET last_task_number = GREATEST(task_sequence.last_task_number, $2)`,
    [projectId, taskNumber]
  );
}

async function createTask(taskId, taskNumber, projectId, title, description, budget, initialActual) {
  const result = await pool.query(
    `INSERT INTO task (
      task_id, task_number, project_id, title,
      description, task_status_id, budget, initial_actual,
      created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [taskId, taskNumber, projectId, title, description || '', 'NEW', budget || 0, initialActual || 0]
  );
  return result.rows[0];
}

async function createTaskEtc(etcId, taskId, companyId, budget) {
  await pool.query(
    `INSERT INTO task_etc (etc_id, task_id, company_id, etc_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [etcId, taskId, companyId, budget]
  );
}

async function updateDraftProjectId(projectDraftId, projectId) {
  await pool.query(
    `UPDATE project_draft
     SET project_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE project_draft_id = $2`,
    [projectId, projectDraftId]
  );
}

async function updateEstimateAsConverted(estimateId, projectId) {
  await pool.query(
    `UPDATE estimate
     SET status = 'CONVERTED', project_id = $1, converted_at = CURRENT_TIMESTAMP
     WHERE estimate_id = $2`,
    [projectId, estimateId]
  );
}

export {
  getEstimateWithCompany,
  findDraftByEstimateId,
  updateProjectDraft,
  createProjectDraft,
  deleteTaskDrafts,
  createTaskDraft,
  getProjectDraftById,
  getTaskDrafts,
  getProjectDraftsByEstimateId,
  getDraftCompanyId,
  deleteProjectDraft,
  checkProjectKeyExists,
  getProjectWithTasksByKey,
  getMaxTaskNumber,
  createProject,
  addProjectManager,
  upsertTaskSequence,
  createTask,
  createTaskEtc,
  updateDraftProjectId,
  updateEstimateAsConverted,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};

export default {
  getEstimateWithCompany,
  findDraftByEstimateId,
  updateProjectDraft,
  createProjectDraft,
  deleteTaskDrafts,
  createTaskDraft,
  getProjectDraftById,
  getTaskDrafts,
  getProjectDraftsByEstimateId,
  getDraftCompanyId,
  deleteProjectDraft,
  checkProjectKeyExists,
  getProjectWithTasksByKey,
  getMaxTaskNumber,
  createProject,
  addProjectManager,
  upsertTaskSequence,
  createTask,
  createTaskEtc,
  updateDraftProjectId,
  updateEstimateAsConverted,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
