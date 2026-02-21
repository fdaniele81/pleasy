import pool from "../db.js";

async function getAllByCompany(companyId) {
  const query = `
    SELECT
      h.holiday_id,
      h.name,
      h.date,
      h.is_recurring,
      h.company_id,
      h.created_at,
      h.updated_at,
      c.legal_name as company_name
    FROM holiday_calendar h
    LEFT JOIN company c ON h.company_id = c.company_id
    WHERE h.company_id = $1
    ORDER BY h.date DESC
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
}

async function checkExists(name, date, companyId) {
  const result = await pool.query(
    `SELECT holiday_id FROM holiday_calendar
     WHERE name = $1 AND date = $2 AND company_id = $3`,
    [name, date, companyId]
  );
  return result.rowCount > 0;
}

async function create(holidayId, name, date, isRecurring, companyId) {
  const result = await pool.query(
    `INSERT INTO holiday_calendar
     (holiday_id, name, date, is_recurring, company_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING holiday_id, name, date, is_recurring, company_id`,
    [holidayId, name, date, isRecurring || false, companyId]
  );
  return result.rows[0];
}

async function getByIdAndCompany(holidayId, companyId) {
  const result = await pool.query(
    "SELECT * FROM holiday_calendar WHERE holiday_id = $1 AND company_id = $2",
    [holidayId, companyId]
  );
  return result.rows[0] || null;
}

async function update(holidayId, name, date, isRecurring) {
  const result = await pool.query(
    `UPDATE holiday_calendar
     SET name = COALESCE($2, name),
         date = COALESCE($3, date),
         is_recurring = COALESCE($4, is_recurring),
         updated_at = NOW()
     WHERE holiday_id = $1
     RETURNING holiday_id, name, date, is_recurring, company_id`,
    [holidayId, name, date, isRecurring]
  );
  return result.rows[0];
}

async function remove(holidayId) {
  await pool.query(
    "DELETE FROM holiday_calendar WHERE holiday_id = $1",
    [holidayId]
  );
}

export {
  getAllByCompany,
  checkExists,
  create,
  getByIdAndCompany,
  update,
  remove,
};

export default {
  getAllByCompany,
  checkExists,
  create,
  getByIdAndCompany,
  update,
  remove,
};
