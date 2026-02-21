import pool from "../db.js";

async function createUser(userId, companyId, email, passwordHash, roleId, fullName) {
  const result = await pool.query(
    `INSERT INTO users
       (user_id, company_id, email, password_hash, role_id, status_id, created_at, updated_at, full_name)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW(), $6)
     RETURNING user_id, company_id, email, role_id, created_at, full_name`,
    [userId, companyId, email, passwordHash, roleId, fullName]
  );
  return result.rows[0];
}

async function getUserById(userId) {
  const result = await pool.query(
    "SELECT company_id, email, password_hash FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0];
}

async function updateUser(userId, email, roleId, statusId, fullName) {
  const result = await pool.query(
    `UPDATE users
        SET email = $2,
            role_id = $3,
            status_id = $4,
            updated_at = NOW(),
            full_name = $5
      WHERE user_id = $1
     RETURNING email, role_id, status_id, updated_at, full_name`,
    [userId, email, roleId, statusId, fullName]
  );
  return result.rows[0];
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE user_id = $2`,
    [passwordHash, userId]
  );
}

async function deleteUser(userId) {
  const result = await pool.query(
    `UPDATE users
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, email, full_name, status_id`,
    [userId]
  );
  return result.rows[0];
}

export {
  createUser,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};

export default {
  createUser,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};
