import pool from "../db.js";
import { validate as isValidUUID } from "uuid";

export async function emailExistsError(email) {
  const result = await pool.query(
    "SELECT user_id FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount > 0) {
    const error = new Error("Email già registrata nel sistema");
    error.statusCode = 409;
    throw error;
  }
}

export async function companyNotExistsError(companyId) {
  if (!isValidUUID(companyId)) {
    const error = new Error("ID company non valido");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT company_id FROM company WHERE company_id = $1",
    [companyId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Company non trovata");
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
    const error = new Error("Ruolo non valido");
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
    const error = new Error("Stato non valido");
    error.statusCode = 404;
    throw error;
  }
}

export async function userNotExistsError(userId) {
  if (!isValidUUID(userId)) {
    const error = new Error("ID utente non valido");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT user_id FROM users WHERE user_id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Utente non presente a sistema");
    error.statusCode = 404;
    throw error;
  }
}

export async function clientNotExistsError(clientId) {
  if (!isValidUUID(clientId)) {
    const error = new Error("ID cliente non valido");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT client_id FROM client WHERE client_id = $1",
    [clientId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Cliente non trovato");
    error.statusCode = 404;
    throw error;
  }
}

export async function projectNotExistsError(projectId) {
  if (!isValidUUID(projectId)) {
    const error = new Error("ID progetto non valido");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    "SELECT project_id FROM project WHERE project_id = $1",
    [projectId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Progetto non trovato");
    error.statusCode = 404;
    throw error;
  }
}

export { isValidUUID };
