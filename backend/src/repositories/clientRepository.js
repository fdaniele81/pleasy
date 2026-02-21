import pool from "../db.js";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";
import { getCompanyIdFromClient } from "./baseRepository.js";

async function checkClientKeyExists(companyId, clientKey) {
  const result = await pool.query(
    "SELECT client_id FROM client WHERE company_id = $1 AND client_key = $2",
    [companyId, clientKey]
  );
  return result.rowCount > 0;
}

async function createClient(clientId, companyId, clientKey, clientName, clientDescription, color, phasesConfig) {
  const result = await pool.query(
    `INSERT INTO client
       (client_id, company_id, client_key, client_name, client_description, color, status_id, project_phases_config, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, NOW(), NOW())
     RETURNING client_id, company_id, client_key, client_name, client_description, color, status_id, project_phases_config, created_at`,
    [clientId, companyId, clientKey, clientName, clientDescription, color || '#6B7280', JSON.stringify(phasesConfig)]
  );
  return result.rows[0];
}

async function updateClient(clientId, clientName, clientDescription, statusId, color, phasesConfig) {
  const result = await pool.query(
    `UPDATE client
        SET client_name = $2,
            client_description = $3,
            status_id = COALESCE($4, status_id),
            color = COALESCE($5, color),
            project_phases_config = COALESCE($6, project_phases_config),
            updated_at = NOW()
      WHERE client_id = $1
     RETURNING client_id, client_key, client_name, client_description, color, status_id, project_phases_config, updated_at`,
    [clientId, clientName, clientDescription, statusId, color, phasesConfig ? JSON.stringify(phasesConfig) : null]
  );
  return result.rows[0];
}

async function deleteClientProjects(clientId) {
  await pool.query(
    `UPDATE project
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE client_id = $1 AND status_id != 'DELETED'`,
    [clientId]
  );
}

async function deleteClient(clientId) {
  const result = await pool.query(
    `UPDATE client
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE client_id = $1
     RETURNING client_id, client_key, client_name, status_id`,
    [clientId]
  );
  return result.rows[0];
}

async function getAllClients(userRole, companyId) {
  let query = `SELECT
       c.client_id,
       c.company_id,
       c.client_key,
       c.client_name,
       c.client_description,
       c.color,
       c.status_id,
       c.project_phases_config,
       c.created_at,
       c.updated_at
     FROM client c
     WHERE c.status_id != 'DELETED'`;

  const queryParams = [];

  if (userRole === "PM") {
    query += ` AND c.company_id = $1`;
    queryParams.push(companyId);
  }

  query += ` ORDER BY c.created_at DESC`;

  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function getClientById(clientId) {
  const result = await pool.query(
    "SELECT client_id, company_id, client_key, client_name, project_phases_config FROM client WHERE client_id = $1",
    [clientId]
  );
  return result.rows[0];
}

async function updatePhasesConfig(clientId, phasesConfig) {
  const result = await pool.query(
    `UPDATE client
        SET project_phases_config = $2,
            updated_at = NOW()
      WHERE client_id = $1
     RETURNING client_id, client_key, client_name, project_phases_config, updated_at`,
    [clientId, JSON.stringify(phasesConfig)]
  );
  return result.rows[0];
}

async function getClientsWithProjects(userRole, companyId) {
  let query = `SELECT
       c.client_id,
       c.company_id,
       c.client_key,
       c.client_name,
       c.client_description,
       c.color,
       c.status_id as client_status_id,
       c.project_phases_config,
       p.project_id,
       p.project_key,
       p.title as project_title,
       p.description as project_description,
       p.status_id as project_status_id,
       p.project_details,
       pm.user_id as pm_user_id,
       u.full_name as pm_full_name,
       u.email as pm_email,
       p.project_type_id
     FROM client c
     LEFT JOIN project p ON p.client_id = c.client_id AND p.status_id NOT IN ('DELETED', 'CANCELLED')
     LEFT JOIN project_manager pm ON pm.project_id = p.project_id
     LEFT JOIN users u ON u.user_id = pm.user_id
     WHERE c.status_id = 'ACTIVE'
     `;

  const queryParams = [];

  if (userRole === "PM") {
    query += ` AND c.company_id = $1`;
    queryParams.push(companyId);
  }

  query += ` ORDER BY c.created_at DESC, p.created_at DESC`;

  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function getTMProjectByClientId(clientId) {
  const result = await pool.query(
    `SELECT project_id, project_key, reconciliation_required FROM project
     WHERE client_id = $1 AND project_type_id = 'TM' AND status_id != 'DELETED'`,
    [clientId]
  );
  return result.rows[0];
}

async function getTMProjectDetails(clientId) {
  const result = await pool.query(
    `SELECT
       p.project_id,
       p.reconciliation_required,
       t.task_id,
       pm.user_id as pm_user_id,
       pm_user.full_name as pm_full_name,
       pm_user.email as pm_email,
       t.owner_id as tm_user_id,
       owner.full_name as tm_full_name,
       owner.email as tm_email
     FROM project p
     LEFT JOIN project_manager pm ON pm.project_id = p.project_id
     LEFT JOIN users pm_user ON pm_user.user_id = pm.user_id
     LEFT JOIN task t ON t.project_id = p.project_id AND t.task_status_id != 'DELETED'
     LEFT JOIN users owner ON owner.user_id = t.owner_id
     WHERE p.client_id = $1 AND p.project_type_id = 'TM' AND p.status_id != 'DELETED'`,
    [clientId]
  );
  return result.rows;
}

async function updateTMReconciliation(clientId, reconciliationRequired) {
  const result = await pool.query(
    `UPDATE project
        SET reconciliation_required = $2,
            updated_at = NOW()
      WHERE client_id = $1 AND project_type_id = 'TM' AND status_id != 'DELETED'
     RETURNING project_id, reconciliation_required`,
    [clientId, reconciliationRequired]
  );
  return result.rows[0];
}

export {
  checkClientKeyExists,
  createClient,
  getCompanyIdFromClient as getClientCompanyId,
  updateClient,
  deleteClientProjects,
  deleteClient,
  getAllClients,
  getClientById,
  updatePhasesConfig,
  getClientsWithProjects,
  getTMProjectByClientId,
  getTMProjectDetails,
  updateTMReconciliation,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};

export default {
  checkClientKeyExists,
  createClient,
  getClientCompanyId: getCompanyIdFromClient,
  updateClient,
  deleteClientProjects,
  deleteClient,
  getAllClients,
  getClientById,
  updatePhasesConfig,
  getClientsWithProjects,
  getTMProjectByClientId,
  getTMProjectDetails,
  updateTMReconciliation,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
