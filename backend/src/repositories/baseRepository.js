import db from "../db.js";

async function getCompanyIdFromProject(projectId) {
  const result = await db.query(
    `SELECT c.company_id
     FROM project p
     JOIN client c ON p.client_id = c.client_id
     WHERE p.project_id = $1`,
    [projectId]
  );
  return result.rows[0]?.company_id;
}

async function getCompanyIdFromClient(clientId) {
  const result = await db.query(
    "SELECT company_id FROM client WHERE client_id = $1",
    [clientId]
  );
  return result.rows[0]?.company_id;
}

async function getCompanyIdFromUser(userId) {
  const result = await db.query(
    "SELECT company_id FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.company_id;
}

async function getCompanyIdFromTask(taskId) {
  const result = await db.query(
    `SELECT c.company_id
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     WHERE t.task_id = $1`,
    [taskId]
  );
  return result.rows[0]?.company_id;
}

async function getUserRole(userId) {
  const result = await db.query(
    "SELECT role_id FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.role_id;
}

export {
  getCompanyIdFromProject,
  getCompanyIdFromClient,
  getCompanyIdFromUser,
  getCompanyIdFromTask,
  getUserRole,
};

export default {
  getCompanyIdFromProject,
  getCompanyIdFromClient,
  getCompanyIdFromUser,
  getCompanyIdFromTask,
  getUserRole,
};
