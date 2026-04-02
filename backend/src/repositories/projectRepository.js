import pool from "../db.js";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";
import { getCompanyIdFromProject, getCompanyIdFromClient, getCompanyIdFromUser, getUserRole } from "./baseRepository.js";

async function checkProjectKeyExists(clientId, projectKey) {
  const result = await pool.query(
    "SELECT project_id FROM project WHERE client_id = $1 AND project_key = $2",
    [clientId, projectKey]
  );
  return result.rowCount > 0;
}

async function checkProjectKeyExistsByCompany(companyId, projectKey) {
  const result = await pool.query(
    `SELECT 1 FROM project p
       INNER JOIN client c ON p.client_id = c.client_id
       WHERE c.company_id = $1 AND p.project_key = $2
     UNION ALL
     SELECT 1 FROM project_draft pd
       INNER JOIN client c ON pd.client_id = c.client_id
       WHERE c.company_id = $1 AND pd.project_key = $2
     LIMIT 1`,
    [companyId, projectKey]
  );
  return result.rowCount > 0;
}

async function createProject(projectId, clientId, projectKey, title, description, statusId, projectDetails, projectTypeId = 'PROJECT', reconciliationRequired = true) {
  const result = await pool.query(
    `INSERT INTO project
       (project_id, client_id, project_key, title, description, status_id, project_details, project_type_id, reconciliation_required, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING project_id, client_id, project_key, title, description, status_id, project_details, project_type_id, reconciliation_required, created_at`,
    [projectId, clientId, projectKey, title, description, statusId, projectDetails, projectTypeId, reconciliationRequired]
  );
  return result.rows[0];
}

async function updateProject(projectId, title, description, statusId, projectDetails, projectTypeId, reconciliationRequired) {
  const result = await pool.query(
    `UPDATE project
        SET title = $2,
            description = $3,
            status_id = COALESCE($4, status_id),
            project_details = COALESCE($5, project_details),
            project_type_id = COALESCE($6, project_type_id),
            reconciliation_required = COALESCE($7, reconciliation_required),
            updated_at = NOW()
      WHERE project_id = $1
     RETURNING project_id, project_key, title, description, status_id, project_details, project_type_id, reconciliation_required, updated_at`,
    [projectId, title, description, statusId, projectDetails, projectTypeId, reconciliationRequired]
  );
  return result.rows[0];
}

async function updateTaskOrder(projectId, taskOrder) {
  const result = await pool.query(
    `UPDATE project
        SET task_order = $2,
            updated_at = NOW()
      WHERE project_id = $1
     RETURNING project_id, task_order`,
    [projectId, taskOrder]
  );
  return result.rows[0];
}

async function deleteProject(projectId) {
  const result = await pool.query(
    `UPDATE project
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE project_id = $1
     RETURNING project_id, project_key, title, status_id, project_type_id`,
    [projectId]
  );
  return result.rows[0];
}

async function checkProjectManagerExists(projectId, userId) {
  const result = await pool.query(
    "SELECT * FROM project_manager WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return result.rowCount > 0;
}

async function addProjectManager(projectId, userId) {
  await pool.query(
    `INSERT INTO project_manager (project_id, user_id, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())`,
    [projectId, userId]
  );
}

async function removeProjectManager(projectId, userId) {
  await pool.query(
    "DELETE FROM project_manager WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
}

async function getUserInfo(userId) {
  const result = await pool.query(
    `SELECT u.user_id, u.email, u.full_name, u.role_id
     FROM users u
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function getProjectManagers(projectId) {
  const result = await pool.query(
    `SELECT
       u.user_id,
       u.email,
       u.full_name,
       u.role_id,
       pm.created_at as assigned_at
     FROM project_manager pm
     JOIN users u ON pm.user_id = u.user_id
     WHERE pm.project_id = $1
     ORDER BY u.full_name`,
    [projectId]
  );
  return result.rows;
}

async function deleteAllProjectManagers(projectId) {
  await pool.query(
    "DELETE FROM project_manager WHERE project_id = $1",
    [projectId]
  );
}

async function getClientKey(clientId) {
  const result = await pool.query(
    "SELECT client_key FROM client WHERE client_id = $1",
    [clientId]
  );
  return result.rows[0]?.client_key;
}

async function getNextProjectNumber(clientId, prefix) {
  const fullPrefix = prefix + '-';
  const result = await pool.query(
    `SELECT project_key FROM project
     WHERE client_id = $1
       AND project_key LIKE $2`,
    [clientId, fullPrefix + '%']
  );

  let maxNumber = 0;
  for (const row of result.rows) {
    const suffix = row.project_key.substring(fullPrefix.length);
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  return maxNumber + 1;
}

async function getAvailableManagers(companyId) {
  const result = await pool.query(
    `SELECT
       user_id,
       email,
       full_name,
       role_id
     FROM users
     WHERE company_id = $1
       AND role_id IN ('PM')
       AND status_id = 'ACTIVE'
     ORDER BY full_name`,
    [companyId]
  );
  return result.rows;
}

export {
  checkProjectKeyExists,
  createProject,
  updateProject,
  updateTaskOrder,
  deleteProject,
  getCompanyIdFromProject as getProjectCompanyId,
  getCompanyIdFromClient as getClientCompanyId,
  getUserRole,
  getCompanyIdFromUser as getUserCompanyId,
  checkProjectManagerExists,
  addProjectManager,
  removeProjectManager,
  getUserInfo,
  getProjectManagers,
  deleteAllProjectManagers,
  getAvailableManagers,
  getClientKey,
  getNextProjectNumber,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};

export default {
  checkProjectKeyExists,
  checkProjectKeyExistsByCompany,
  createProject,
  updateProject,
  updateTaskOrder,
  deleteProject,
  getProjectCompanyId: getCompanyIdFromProject,
  getClientCompanyId: getCompanyIdFromClient,
  getUserRole,
  getUserCompanyId: getCompanyIdFromUser,
  checkProjectManagerExists,
  addProjectManager,
  removeProjectManager,
  getUserInfo,
  getProjectManagers,
  deleteAllProjectManagers,
  getAvailableManagers,
  getClientKey,
  getNextProjectNumber,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
