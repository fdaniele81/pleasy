import pool from "../db.js";
import { validate as isValidUUID } from "uuid";

export async function emailExistsError(email) {
  const result = await pool.query(
    "SELECT user_id FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount > 0) {
    const error = new Error("Email already registered");
    error.code = "EMAIL_ALREADY_EXISTS";
    error.statusCode = 409;
    throw error;
  }
}

export async function companyNotExistsError(companyId) {
  if (!isValidUUID(companyId)) {
    const error = new Error("Invalid company ID");
    error.code = "INVALID_COMPANY_ID";
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT company_id FROM company WHERE company_id = $1",
    [companyId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Company not found");
    error.code = "COMPANY_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
}

export async function roleNotExistsError(roleId) {
  const result = await pool.query(
    "SELECT role_id FROM role WHERE role_id = $1",
    [roleId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Invalid role");
    error.code = "INVALID_ROLE";
    error.statusCode = 404;
    throw error;
  }
}

export async function statusNotExistsError(statusId) {
  const result = await pool.query(
    "SELECT status_id FROM status WHERE status_id = $1",
    [statusId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Invalid status");
    error.code = "INVALID_STATUS";
    error.statusCode = 404;
    throw error;
  }
}

export async function userNotExistsError(userId) {
  if (!isValidUUID(userId)) {
    const error = new Error("Invalid user ID");
    error.code = "INVALID_USER_ID";
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT user_id FROM users WHERE user_id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
}

export async function clientNotExistsError(clientId) {
  if (!isValidUUID(clientId)) {
    const error = new Error("Invalid client ID");
    error.code = "INVALID_CLIENT_ID";
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT client_id FROM client WHERE client_id = $1",
    [clientId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Client not found");
    error.code = "CLIENT_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
}

export async function projectNotExistsError(projectId) {
  if (!isValidUUID(projectId)) {
    const error = new Error("Invalid project ID");
    error.code = "INVALID_PROJECT_ID";
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT project_id FROM project WHERE project_id = $1",
    [projectId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Project not found");
    error.code = "PROJECT_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
}

export { isValidUUID };
