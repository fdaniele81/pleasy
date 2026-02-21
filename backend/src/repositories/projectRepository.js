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

async function createProject(projectId, clientId, projectKey, title, description, statusId, projectDetails, projectTypeId = 'PROJECT') {
  const result = await pool.query(
    `INSERT INTO project
       (project_id, client_id, project_key, title, description, status_id, project_details, project_type_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING project_id, client_id, project_key, title, description, status_id, project_details, project_type_id, created_at`,
    [projectId, clientId, projectKey, title, description, statusId, projectDetails, projectTypeId]
  );
  return result.rows[0];
}

async function updateProject(projectId, title, description, statusId, projectDetails, projectTypeId) {
  const result = await pool.query(
    `UPDATE project
        SET title = $2,
            description = $3,
            status_id = COALESCE($4, status_id),
            project_details = COALESCE($5, project_details),
            project_type_id = COALESCE($6, project_type_id),
            updated_at = NOW()
      WHERE project_id = $1
     RETURNING project_id, project_key, title, description, status_id, project_details, project_type_id, updated_at`,
    [projectId, title, description, statusId, projectDetails, projectTypeId]
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
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};

export default {
  checkProjectKeyExists,
  createProject,
  updateProject,
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
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
