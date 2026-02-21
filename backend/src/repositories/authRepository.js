import pool from "../db.js";

async function _getUserByEmailInternal(email, includePassword = false) {
  const passwordField = includePassword ? "u.password_hash, " : "";
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, ${passwordField}u.company_id, u.role_id, u.status_id, r.description
     FROM users u
     JOIN role r ON u.role_id = r.role_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function getUserByEmail(email) {
  return _getUserByEmailInternal(email, true);
}

async function getUserByEmailForImpersonate(email) {
  return _getUserByEmailInternal(email, false);
}

async function getUserById(userId) {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.company_id, u.role_id, u.status_id, r.description
     FROM users u
     JOIN role r ON u.role_id = r.role_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

export {
  getUserByEmail,
  getUserByEmailForImpersonate,
  getUserById,
};

export default {
  getUserByEmail,
  getUserByEmailForImpersonate,
  getUserById,
};
