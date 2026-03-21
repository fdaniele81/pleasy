import pool from "../db.js";

async function createUser(userId, companyId, email, passwordHash, roleId, fullName, mustChangePassword = false, symbolLetter = null, symbolBgColor = null, symbolLetterColor = null, preferredUnit = 'HOURS') {
  const result = await pool.query(
    `INSERT INTO users
       (user_id, company_id, email, password_hash, role_id, status_id, created_at, updated_at, full_name, must_change_password, symbol_letter, symbol_bg_color, symbol_letter_color, preferred_unit)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW(), $6, $7, $8, COALESCE($9, '#6B7280'), COALESCE($10, '#FFFFFF'), COALESCE($11, 'HOURS'))
     RETURNING user_id, company_id, email, role_id, created_at, full_name, symbol_letter, symbol_bg_color, symbol_letter_color, preferred_unit`,
    [userId, companyId, email, passwordHash, roleId, fullName, mustChangePassword, symbolLetter || null, symbolBgColor || null, symbolLetterColor || null, preferredUnit || 'HOURS']
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

async function updateUser(userId, email, roleId, statusId, fullName, mustChangePassword, symbolLetter, symbolBgColor, symbolLetterColor, preferredUnit) {
  const result = await pool.query(
    `UPDATE users
        SET email = $2,
            role_id = $3,
            status_id = $4,
            updated_at = NOW(),
            full_name = $5,
            must_change_password = COALESCE($6, must_change_password),
            symbol_letter = $7,
            symbol_bg_color = COALESCE($8, symbol_bg_color),
            symbol_letter_color = COALESCE($9, symbol_letter_color),
            preferred_unit = COALESCE($10, preferred_unit)
      WHERE user_id = $1
     RETURNING email, role_id, status_id, updated_at, full_name, must_change_password, symbol_letter, symbol_bg_color, symbol_letter_color, preferred_unit`,
    [userId, email, roleId, statusId, fullName, mustChangePassword, symbolLetter !== undefined ? symbolLetter : null, symbolBgColor || null, symbolLetterColor || null, preferredUnit || null]
  );
  return result.rows[0];
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW(), token_version = COALESCE(token_version, 0) + 1, must_change_password = false
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

async function updatePreferredUnit(userId, preferredUnit) {
  const result = await pool.query(
    `UPDATE users
     SET preferred_unit = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING preferred_unit`,
    [preferredUnit, userId]
  );
  return result.rows[0]?.preferred_unit;
}

async function getPreferredUnit(userId) {
  const result = await pool.query(
    "SELECT preferred_unit FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.preferred_unit || 'HOURS';
}

async function getDefaultPhasesConfig(userId) {
  const result = await pool.query(
    "SELECT default_phases_config FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.default_phases_config || null;
}

async function updateDefaultPhasesConfig(userId, config) {
  const result = await pool.query(
    `UPDATE users
     SET default_phases_config = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING default_phases_config`,
    [JSON.stringify(config), userId]
  );
  return result.rows[0]?.default_phases_config;
}

async function getSavedFilters(userId) {
  const result = await pool.query(
    "SELECT saved_filters FROM users WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.saved_filters || {};
}

async function updateSavedFilters(userId, savedFilters) {
  const result = await pool.query(
    `UPDATE users
     SET saved_filters = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING saved_filters`,
    [JSON.stringify(savedFilters), userId]
  );
  return result.rows[0]?.saved_filters;
}

export {
  createUser,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
  updatePreferredUnit,
  getPreferredUnit,
  getDefaultPhasesConfig,
  updateDefaultPhasesConfig,
  getSavedFilters,
  updateSavedFilters,
};

export default {
  createUser,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
  updatePreferredUnit,
  getPreferredUnit,
  getDefaultPhasesConfig,
  updateDefaultPhasesConfig,
  getSavedFilters,
  updateSavedFilters,
};
