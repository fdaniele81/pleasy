import pool from "../db.js";

async function getByUserAndDateRange(userId, companyId, startDate, endDate) {
  const query = `
    SELECT
      uto.time_off_id,
      uto.time_off_type_id,
      TO_CHAR(uto.date, 'YYYY-MM-DD') as date,
      uto.hours,
      uto.details,
      tot.description as time_off_type_description
    FROM user_time_off_plan uto
    JOIN time_off_type tot ON uto.time_off_type_id = tot.time_off_type_id
    WHERE uto.user_id = $1
      AND uto.company_id = $2
      AND uto.date BETWEEN $3 AND $4
    ORDER BY uto.date
  `;

  const result = await pool.query(query, [userId, companyId, startDate, endDate]);
  return result.rows;
}

async function getHistoricalTotals(userId, companyId) {
  const query = `
    SELECT
      tot.time_off_type_id,
      tot.description as time_off_type_description,
      COALESCE(SUM(uto.hours), 0) as total_hours
    FROM time_off_type tot
    LEFT JOIN user_time_off_plan uto ON tot.time_off_type_id = uto.time_off_type_id
      AND uto.user_id = $1
      AND uto.company_id = $2
    GROUP BY tot.time_off_type_id, tot.description
    ORDER BY tot.time_off_type_id
  `;

  const result = await pool.query(query, [userId, companyId]);
  return result.rows;
}

async function isHoliday(companyId, date) {
  const result = await pool.query(
    `SELECT holiday_id FROM holiday_calendar
     WHERE company_id = $1
     AND (
       (date = $2 AND is_recurring = false)
       OR (EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM $2::date)
           AND EXTRACT(DAY FROM date) = EXTRACT(DAY FROM $2::date)
           AND is_recurring = true)
     )`,
    [companyId, date]
  );
  return result.rowCount > 0;
}

async function timeOffTypeExists(timeOffTypeId) {
  const result = await pool.query(
    "SELECT time_off_type_id FROM time_off_type WHERE time_off_type_id = $1",
    [timeOffTypeId]
  );
  return result.rowCount > 0;
}

async function deleteByUserTypeAndDate(userId, companyId, timeOffTypeId, date) {
  const result = await pool.query(
    `DELETE FROM user_time_off_plan
     WHERE user_id = $1 AND company_id = $2 AND time_off_type_id = $3 AND date = $4
     RETURNING time_off_id`,
    [userId, companyId, timeOffTypeId, date]
  );
  return result.rows[0] || null;
}

async function getExisting(userId, companyId, timeOffTypeId, date) {
  const result = await pool.query(
    `SELECT time_off_id FROM user_time_off_plan
     WHERE user_id = $1 AND company_id = $2 AND time_off_type_id = $3 AND date = $4`,
    [userId, companyId, timeOffTypeId, date]
  );
  return result.rows[0] || null;
}

async function update(userId, companyId, timeOffTypeId, date, hours, details) {
  const result = await pool.query(
    `UPDATE user_time_off_plan
     SET hours = $5, details = $6, updated_at = NOW()
     WHERE user_id = $1 AND company_id = $2 AND time_off_type_id = $3 AND date = $4
     RETURNING time_off_id, user_id, company_id, time_off_type_id, TO_CHAR(date, 'YYYY-MM-DD') as date, hours, details`,
    [userId, companyId, timeOffTypeId, date, hours, details]
  );
  return result.rows[0];
}

async function create(userId, companyId, timeOffTypeId, date, hours, details) {
  const result = await pool.query(
    `INSERT INTO user_time_off_plan (user_id, company_id, time_off_type_id, date, hours, details, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING time_off_id, user_id, company_id, time_off_type_id, TO_CHAR(date, 'YYYY-MM-DD') as date, hours, details`,
    [userId, companyId, timeOffTypeId, date, hours, details]
  );
  return result.rows[0];
}

async function deleteByIdAndUser(timeOffId, userId) {
  const result = await pool.query(
    `DELETE FROM user_time_off_plan
     WHERE time_off_id = $1 AND user_id = $2
     RETURNING time_off_id`,
    [timeOffId, userId]
  );
  return result.rows[0] || null;
}

async function getAllTypes() {
  const result = await pool.query(
    `SELECT time_off_type_id, description FROM time_off_type ORDER BY time_off_type_id`
  );
  return result.rows;
}

async function getTotalsByType(userId, companyId, startDate, endDate) {
  const query = `
    SELECT
      uto.time_off_type_id,
      tot.description as time_off_type_description,
      SUM(uto.hours) as total_hours
    FROM user_time_off_plan uto
    JOIN time_off_type tot ON uto.time_off_type_id = tot.time_off_type_id
    WHERE uto.user_id = $1
      AND uto.company_id = $2
      AND uto.date BETWEEN $3 AND $4
    GROUP BY uto.time_off_type_id, tot.description
    ORDER BY uto.time_off_type_id
  `;

  const result = await pool.query(query, [userId, companyId, startDate, endDate]);
  return result.rows;
}

async function getForCapacityPlanning(pmUserId, companyId, startDate, endDate) {
  let query = `
    SELECT
      u.user_id,
      u.full_name,
      uto.time_off_type_id,
      tot.description as time_off_type_description,
      SUM(uto.hours) as total_hours
    FROM project_manager pm
    JOIN project p ON pm.project_id = p.project_id
    JOIN task t ON t.project_id = p.project_id
    JOIN users u ON t.owner_id = u.user_id
    JOIN user_time_off_plan uto ON uto.user_id = u.user_id
    JOIN time_off_type tot ON uto.time_off_type_id = tot.time_off_type_id
    WHERE pm.user_id = $1
      AND uto.company_id = $2
      ${startDate && endDate ? 'AND uto.date BETWEEN $3 AND $4' : ''}
      AND t.task_status_id != 'DELETED'
    GROUP BY u.user_id, u.full_name, uto.time_off_type_id, tot.description
    ORDER BY u.full_name, uto.time_off_type_id
  `;

  const params = startDate && endDate
    ? [pmUserId, companyId, startDate, endDate]
    : [pmUserId, companyId];

  const result = await pool.query(query, params);
  return result.rows;
}

async function getGanttDaily(pmUserId, companyId, startDate, endDate) {
  const teamQuery = `
    SELECT DISTINCT t.owner_id
    FROM project_manager pm
    JOIN task t ON t.project_id = pm.project_id
    WHERE pm.user_id = $1
      AND t.task_status_id != 'DELETED'
      AND t.owner_id IS NOT NULL
  `;

  const teamResult = await pool.query(teamQuery, [pmUserId]);

  const teamUserIds = teamResult.rows.map(r => r.owner_id);

  if (teamUserIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      u.user_id,
      u.full_name,
      uto.time_off_type_id,
      TO_CHAR(uto.date, 'YYYY-MM-DD') as date,
      uto.hours,
      uto.details
    FROM user_time_off_plan uto
    JOIN users u ON uto.user_id = u.user_id
    WHERE uto.company_id = $1
      AND uto.date BETWEEN $2 AND $3
      AND u.user_id = ANY($4)
  `;

  const result = await pool.query(query, [companyId, startDate, endDate, teamUserIds]);
  return result.rows;
}

async function getCompanyUsers(companyId) {
  const query = `
    SELECT
      u.user_id,
      u.full_name,
      u.email
    FROM users u
    WHERE u.company_id = $1
      AND u.status_id = 'ACTIVE'
    ORDER BY u.full_name
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
}

async function getCompanyTimeOffs(companyId, startDate, endDate) {
  const query = `
    SELECT
      uto.time_off_id,
      uto.user_id,
      uto.time_off_type_id,
      TO_CHAR(uto.date, 'YYYY-MM-DD') as date,
      uto.hours,
      uto.details,
      tot.description as time_off_type_description
    FROM user_time_off_plan uto
    JOIN time_off_type tot ON uto.time_off_type_id = tot.time_off_type_id
    WHERE uto.company_id = $1
      AND uto.date BETWEEN $2 AND $3
    ORDER BY uto.user_id, uto.date
  `;

  const result = await pool.query(query, [companyId, startDate, endDate]);
  return result.rows;
}

export {
  getByUserAndDateRange,
  getHistoricalTotals,
  isHoliday,
  timeOffTypeExists,
  deleteByUserTypeAndDate,
  getExisting,
  update,
  create,
  deleteByIdAndUser,
  getAllTypes,
  getTotalsByType,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyUsers,
  getCompanyTimeOffs,
};

export default {
  getByUserAndDateRange,
  getHistoricalTotals,
  isHoliday,
  timeOffTypeExists,
  deleteByUserTypeAndDate,
  getExisting,
  update,
  create,
  deleteByIdAndUser,
  getAllTypes,
  getTotalsByType,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyUsers,
  getCompanyTimeOffs,
};
