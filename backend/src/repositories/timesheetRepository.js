import db from "../db.js";

async function getTimesheets(userId, startDate, endDate) {
  const query = `
    WITH task_totals AS (
      SELECT
        task_id,
        SUM(total_hours) as total_hours_worked
      FROM task_timesheet
      GROUP BY task_id
    ),
    user_non_submitted AS (
      SELECT
        task_id,
        SUM(total_hours) as non_submitted_hours
      FROM task_timesheet
      WHERE user_id = $1 AND snapshot_id IS NULL
      GROUP BY task_id
    )
    SELECT
      t.task_id,
      t.task_number,
      t.title as task_title,
      t.description as task_description,
      t.budget,
      t.initial_actual,
      TO_CHAR(t.end_date, 'YYYY-MM-DD') as end_date,
      p.project_id,
      p.project_key,
      p.title as project_title,
      p.project_type_id,
      c.client_id,
      c.client_key,
      c.client_name,
      c.color as client_color,
      COALESCE(tt.total_hours_worked, 0) as task_total_hours,
      COALESCE(te.etc_hours, 0) as etc_hours,
      COALESCE(uns.non_submitted_hours, 0) as user_non_submitted_hours,
      ts.timesheet_id,
      TO_CHAR(ts.timesheet_date, 'YYYY-MM-DD') as timesheet_date,
      ts.total_hours,
      ts.details,
      ts.snapshot_id,
      tts.is_submitted
    FROM task t
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN task_totals tt ON tt.task_id = t.task_id
    LEFT JOIN task_etc te ON te.task_id = t.task_id
    LEFT JOIN user_non_submitted uns ON uns.task_id = t.task_id
    LEFT JOIN task_timesheet ts ON ts.task_id = t.task_id
      AND ts.user_id = $1
      AND ts.timesheet_date BETWEEN $2 AND $3
    LEFT JOIN timesheet_snapshot tts on ts.snapshot_id = tts.snapshot_id
    WHERE t.owner_id = $1
      AND t.task_status_id = 'IN PROGRESS'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
    ORDER BY c.client_name, p.project_key, t.task_number, ts.timesheet_date`;

  const result = await db.query(query, [userId, startDate, endDate]);
  return result.rows;
}

async function getClosedActivitiesTotal(userId) {
  const query = `
    SELECT COALESCE(SUM(tt.total_hours), 0) as total_hours_worked
    FROM task_timesheet tt
    JOIN task t ON tt.task_id = t.task_id
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    WHERE tt.user_id = $1
      AND t.owner_id = $1
      AND t.task_status_id = 'DONE'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'`;

  const result = await db.query(query, [userId]);
  return parseFloat(result.rows[0].total_hours_worked) || 0;
}

async function getClosedActivitiesTimesheets(userId, startDate, endDate) {
  const query = `
    SELECT
      tt.timesheet_id,
      TO_CHAR(tt.timesheet_date, 'YYYY-MM-DD') as timesheet_date,
      tt.total_hours,
      tt.snapshot_id,
      tts.is_submitted,
      t.task_id,
      t.task_number,
      t.title as task_title,
      t.task_status_id,
      p.project_key,
      p.title as project_title,
      c.client_name,
      c.color as client_color
    FROM task_timesheet tt
    JOIN task t ON tt.task_id = t.task_id
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN timesheet_snapshot tts on tt.snapshot_id = tts.snapshot_id
    WHERE tt.user_id = $1
      AND tt.timesheet_date BETWEEN $2 AND $3
      AND t.owner_id = $1
      AND t.task_status_id = 'DONE'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
    ORDER BY tt.timesheet_date, c.client_name, p.project_key, t.task_number`;

  const result = await db.query(query, [userId, startDate, endDate]);
  return result.rows;
}

async function findTaskOwner(taskId) {
  const result = await db.query(
    "SELECT owner_id FROM task WHERE task_id = $1",
    [taskId]
  );
  return result.rows[0] || null;
}

async function findTaskCompany(taskId) {
  const result = await db.query(
    `SELECT c.company_id
     FROM task t
     JOIN project p ON t.project_id = p.project_id
     JOIN client c ON p.client_id = c.client_id
     WHERE t.task_id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function upsertTimesheet(data) {
  const result = await db.query(
    `INSERT INTO task_timesheet (task_id, company_id, user_id, timesheet_date, total_hours, details, external_key, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (task_id, user_id, timesheet_date)
     DO UPDATE SET
       total_hours = $5,
       details = COALESCE($6, task_timesheet.details),
       external_key = $7,
       updated_at = NOW()
     RETURNING timesheet_id, task_id, user_id, TO_CHAR(timesheet_date, 'YYYY-MM-DD') as timesheet_date, total_hours, details, external_key, snapshot_id,
     CASE WHEN snapshot_id IS NOT NULL THEN true ELSE false END as is_submitted`,
    [data.task_id, data.company_id, data.user_id, data.work_date, data.hours_worked, data.details, data.external_key]
  );
  return result.rows[0];
}

async function deleteTimesheet(timesheetId, userId) {
  const result = await db.query(
    `DELETE FROM task_timesheet
     WHERE timesheet_id = $1 AND user_id = $2
     RETURNING timesheet_id`,
    [timesheetId, userId]
  );
  return result.rows[0] || null;
}

async function countNonSubmittedTimesheets(userId, client) {
  const conn = client || db;
  const result = await conn.query(
    `SELECT COUNT(*) as count
     FROM task_timesheet
     WHERE user_id = $1 AND snapshot_id IS NULL`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

async function createSnapshot(userId, companyId, client) {
  const result = await client.query(
    `INSERT INTO timesheet_snapshot (user_id, company_id, is_submitted, submitted_at, created_at, updated_at)
     VALUES ($1, $2, true, NOW(), NOW(), NOW())
     RETURNING snapshot_id`,
    [userId, companyId]
  );
  return result.rows[0].snapshot_id;
}

async function updateTimesheetsWithSnapshot(snapshotId, userId, client) {
  const result = await client.query(
    `UPDATE task_timesheet
     SET snapshot_id = $1, updated_at = NOW()
     WHERE user_id = $2
       AND snapshot_id IS NULL
     RETURNING timesheet_id, task_id, total_hours`,
    [snapshotId, userId]
  );
  return result.rows;
}

async function validateTimesheetsForSubmission(timesheetIds, userId, client) {
  const result = await client.query(
    `SELECT timesheet_id
     FROM task_timesheet
     WHERE timesheet_id = ANY($1)
       AND user_id = $2
       AND snapshot_id IS NULL`,
    [timesheetIds, userId]
  );
  return result.rows;
}

async function updateTimesheetsWithSnapshotByIds(snapshotId, timesheetIds, userId, client) {
  const result = await client.query(
    `UPDATE task_timesheet
     SET snapshot_id = $1, updated_at = NOW()
     WHERE timesheet_id = ANY($2)
       AND user_id = $3
       AND snapshot_id IS NULL
     RETURNING timesheet_id, task_id, total_hours`,
    [snapshotId, timesheetIds, userId]
  );
  return result.rows;
}

async function getTaskETC(taskId, client) {
  const result = await client.query(
    `SELECT etc_hours FROM task_etc WHERE task_id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function updateTaskETC(taskId, etcHours, client) {
  await client.query(
    `UPDATE task_etc
     SET etc_hours = $1, updated_at = NOW()
     WHERE task_id = $2`,
    [etcHours, taskId]
  );
}

async function getMaxSubmittedDate(userId) {
  const result = await db.query(
    `SELECT TO_CHAR(MAX(tt.timesheet_date), 'YYYY-MM-DD') as max_submitted_date
     FROM task_timesheet tt
     JOIN timesheet_snapshot ts ON tt.snapshot_id = ts.snapshot_id
     WHERE tt.user_id = $1 AND ts.is_submitted = true`,
    [userId]
  );
  return result.rows[0].max_submitted_date;
}

async function getDatesWithTimesheets(userId, startDate, endDate) {
  const result = await db.query(
    `SELECT DISTINCT TO_CHAR(tt.timesheet_date, 'YYYY-MM-DD') as date
     FROM task_timesheet tt
     JOIN timesheet_snapshot ts ON tt.snapshot_id = ts.snapshot_id
     WHERE tt.user_id = $1
       AND ts.is_submitted = true
       AND tt.timesheet_date BETWEEN $2 AND $3
     ORDER BY date`,
    [userId, startDate, endDate]
  );
  return result.rows.map(row => row.date);
}

async function getSnapshotsForPM(companyId, startDate, endDate) {
  let query;
  let params;

  if (startDate && endDate) {
    query = `
      SELECT
        ts.snapshot_id, ts.user_id, u.full_name, u.email,
        ts.company_id, co.legal_name, ts.is_submitted,
        TO_CHAR(ts.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
        TO_CHAR(MIN(tt.timesheet_date), 'YYYY-MM-DD') as min_date,
        TO_CHAR(MAX(tt.timesheet_date), 'YYYY-MM-DD') as max_date,
        COUNT(tt.timesheet_id) as timesheet_count,
        SUM(tt.total_hours) as total_hours
      FROM timesheet_snapshot ts
      JOIN users u ON ts.user_id = u.user_id
      JOIN company co ON ts.company_id = co.company_id
      LEFT JOIN task_timesheet tt ON tt.snapshot_id = ts.snapshot_id
      WHERE ts.is_submitted = true AND ts.company_id = $1
        AND EXISTS (
          SELECT 1 FROM task_timesheet tt2
          WHERE tt2.snapshot_id = ts.snapshot_id
          AND tt2.timesheet_date BETWEEN $2 AND $3
        )
      GROUP BY ts.snapshot_id, ts.user_id, u.full_name, u.email,
               ts.company_id, co.legal_name, ts.is_submitted, ts.submitted_at
      ORDER BY u.full_name, ts.submitted_at DESC`;
    params = [companyId, startDate, endDate];
  } else {
    query = `
      SELECT
        ts.snapshot_id, ts.user_id, u.full_name, u.email,
        ts.company_id, co.legal_name, ts.is_submitted,
        TO_CHAR(ts.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
        TO_CHAR(MIN(tt.timesheet_date), 'YYYY-MM-DD') as min_date,
        TO_CHAR(MAX(tt.timesheet_date), 'YYYY-MM-DD') as max_date,
        COUNT(tt.timesheet_id) as timesheet_count,
        SUM(tt.total_hours) as total_hours
      FROM timesheet_snapshot ts
      JOIN users u ON ts.user_id = u.user_id
      JOIN company co ON ts.company_id = co.company_id
      LEFT JOIN task_timesheet tt ON tt.snapshot_id = ts.snapshot_id
      WHERE ts.is_submitted = true AND ts.company_id = $1
      GROUP BY ts.snapshot_id, ts.user_id, u.full_name, u.email,
               ts.company_id, co.legal_name, ts.is_submitted, ts.submitted_at
      ORDER BY u.full_name, ts.submitted_at DESC`;
    params = [companyId];
  }

  const result = await db.query(query, params);
  return result.rows;
}

async function getSnapshotsForUser(userId, startDate, endDate) {
  let query;
  let params;

  if (startDate && endDate) {
    query = `
      SELECT
        ts.snapshot_id, ts.user_id, u.full_name, u.email,
        ts.company_id, co.legal_name, ts.is_submitted,
        TO_CHAR(ts.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
        TO_CHAR(MIN(tt.timesheet_date), 'YYYY-MM-DD') as min_date,
        TO_CHAR(MAX(tt.timesheet_date), 'YYYY-MM-DD') as max_date,
        COUNT(tt.timesheet_id) as timesheet_count,
        SUM(tt.total_hours) as total_hours
      FROM timesheet_snapshot ts
      JOIN users u ON ts.user_id = u.user_id
      JOIN company co ON ts.company_id = co.company_id
      LEFT JOIN task_timesheet tt ON tt.snapshot_id = ts.snapshot_id
      WHERE ts.is_submitted = true AND ts.user_id = $1
        AND EXISTS (
          SELECT 1 FROM task_timesheet tt2
          WHERE tt2.snapshot_id = ts.snapshot_id
          AND tt2.timesheet_date BETWEEN $2 AND $3
        )
      GROUP BY ts.snapshot_id, ts.user_id, u.full_name, u.email,
               ts.company_id, co.legal_name, ts.is_submitted, ts.submitted_at
      ORDER BY u.full_name, ts.submitted_at DESC`;
    params = [userId, startDate, endDate];
  } else {
    query = `
      SELECT
        ts.snapshot_id, ts.user_id, u.full_name, u.email,
        ts.company_id, co.legal_name, ts.is_submitted,
        TO_CHAR(ts.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
        TO_CHAR(MIN(tt.timesheet_date), 'YYYY-MM-DD') as min_date,
        TO_CHAR(MAX(tt.timesheet_date), 'YYYY-MM-DD') as max_date,
        COUNT(tt.timesheet_id) as timesheet_count,
        SUM(tt.total_hours) as total_hours
      FROM timesheet_snapshot ts
      JOIN users u ON ts.user_id = u.user_id
      JOIN company co ON ts.company_id = co.company_id
      LEFT JOIN task_timesheet tt ON tt.snapshot_id = ts.snapshot_id
      WHERE ts.is_submitted = true AND ts.user_id = $1
      GROUP BY ts.snapshot_id, ts.user_id, u.full_name, u.email,
               ts.company_id, co.legal_name, ts.is_submitted, ts.submitted_at
      ORDER BY u.full_name, ts.submitted_at DESC`;
    params = [userId];
  }

  const result = await db.query(query, params);
  return result.rows;
}

async function findSnapshotById(snapshotId, client) {
  const conn = client || db;
  const result = await conn.query(
    `SELECT snapshot_id, user_id, company_id, is_submitted, TO_CHAR(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at
     FROM timesheet_snapshot
     WHERE snapshot_id = $1`,
    [snapshotId]
  );
  return result.rows[0] || null;
}

async function getSnapshotDetails(snapshotId) {
  const query = `
    SELECT
      tt.timesheet_id, tt.task_id,
      TO_CHAR(tt.timesheet_date, 'YYYY-MM-DD') as timesheet_date,
      tt.total_hours, tt.details,
      t.task_number, t.title as task_title, t.description as task_description,
      p.project_id, p.project_key, p.title as project_title, p.project_type_id,
      c.client_id, c.client_key, c.client_name, c.color as client_color
    FROM task_timesheet tt
    JOIN task t ON tt.task_id = t.task_id
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    WHERE tt.snapshot_id = $1
    ORDER BY c.client_name, p.project_key, t.task_number, tt.timesheet_date`;

  const result = await db.query(query, [snapshotId]);
  return result.rows;
}

async function getPreviewSubmission(userId) {
  const query = `
    SELECT
      tt.timesheet_id, tt.task_id,
      TO_CHAR(tt.timesheet_date, 'YYYY-MM-DD') as timesheet_date,
      tt.total_hours, tt.details,
      t.task_number, t.title as task_title, t.description as task_description,
      p.project_id, p.project_key, p.title as project_title, p.project_type_id,
      c.client_id, c.client_key, c.client_name, c.color as client_color
    FROM task_timesheet tt
    JOIN task t ON tt.task_id = t.task_id
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    WHERE tt.user_id = $1 AND tt.snapshot_id IS NULL
      AND t.task_status_id != 'DELETED'
    ORDER BY p.project_type_id, c.client_name, p.project_key, t.task_number, tt.timesheet_date`;

  const result = await db.query(query, [userId]);
  return result.rows;
}

async function getTimesheetsToReopen(snapshotId, client) {
  const result = await client.query(
    `SELECT task_id, SUM(total_hours) as total_hours
     FROM task_timesheet
     WHERE snapshot_id = $1
     GROUP BY task_id`,
    [snapshotId]
  );
  return result.rows;
}

async function reopenTimesheets(snapshotId, client) {
  const result = await client.query(
    `UPDATE task_timesheet
     SET snapshot_id = NULL, updated_at = NOW()
     WHERE snapshot_id = $1
     RETURNING timesheet_id`,
    [snapshotId]
  );
  return result.rows;
}

async function updateSnapshotStatus(snapshotId, isSubmitted, client) {
  await client.query(
    `UPDATE timesheet_snapshot
     SET is_submitted = $2, updated_at = NOW()
     WHERE snapshot_id = $1`,
    [snapshotId, isSubmitted]
  );
}

function getPool() {
  return db.pool;
}

async function getTMPlanningData(companyId, startDate, endDate, pmUserId) {
  const query = `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      c.client_id,
      c.client_key,
      c.client_name,
      c.color as client_color,
      p.project_id,
      p.project_key,
      t.task_id,
      ts.timesheet_id,
      TO_CHAR(ts.timesheet_date, 'YYYY-MM-DD') as timesheet_date,
      ts.total_hours,
      ts.details,
      ts.external_key,
      CASE WHEN ts.snapshot_id IS NOT NULL THEN true ELSE false END as is_submitted,
      COALESCE(task_totals.total_hours_all, 0) as total_hours_all
    FROM task t
    JOIN project p ON t.project_id = p.project_id
    JOIN project_manager pm ON pm.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    JOIN users u ON t.owner_id = u.user_id
    LEFT JOIN task_timesheet ts ON ts.task_id = t.task_id
      AND ts.timesheet_date BETWEEN $2 AND $3
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(tts.total_hours), 0) as total_hours_all
      FROM task_timesheet tts
      WHERE tts.task_id = t.task_id
    ) task_totals ON true
    WHERE p.project_type_id = 'TM'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
      AND c.company_id = $1
      AND t.task_status_id != 'DELETED'
      AND pm.user_id = $4
    ORDER BY u.full_name, c.client_name, ts.timesheet_date`;

  const result = await db.query(query, [companyId, startDate, endDate, pmUserId]);
  return result.rows;
}

async function getTMTasksHoursTotals(userId) {
  const query = `
    SELECT
      t.task_id,
      COALESCE(SUM(CASE WHEN ts.timesheet_date < CURRENT_DATE THEN ts.total_hours ELSE 0 END), 0) as hours_before_today,
      COALESCE(SUM(CASE WHEN ts.timesheet_date >= CURRENT_DATE THEN ts.total_hours ELSE 0 END), 0) as hours_from_today
    FROM task t
    JOIN project p ON t.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN task_timesheet ts ON ts.task_id = t.task_id AND ts.user_id = $1
    WHERE t.owner_id = $1
      AND t.task_status_id = 'IN PROGRESS'
      AND p.project_type_id = 'TM'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
    GROUP BY t.task_id`;

  const result = await db.query(query, [userId]);
  return result.rows;
}

export {
  getTimesheets,
  getClosedActivitiesTotal,
  getClosedActivitiesTimesheets,
  findTaskOwner,
  findTaskCompany,
  upsertTimesheet,
  deleteTimesheet,
  countNonSubmittedTimesheets,
  createSnapshot,
  updateTimesheetsWithSnapshot,
  validateTimesheetsForSubmission,
  updateTimesheetsWithSnapshotByIds,
  getTaskETC,
  updateTaskETC,
  getMaxSubmittedDate,
  getDatesWithTimesheets,
  getSnapshotsForPM,
  getSnapshotsForUser,
  findSnapshotById,
  getSnapshotDetails,
  getPreviewSubmission,
  getTimesheetsToReopen,
  reopenTimesheets,
  updateSnapshotStatus,
  getPool,
  getTMPlanningData,
  getTMTasksHoursTotals
};

export default {
  getTimesheets,
  getClosedActivitiesTotal,
  getClosedActivitiesTimesheets,
  findTaskOwner,
  findTaskCompany,
  upsertTimesheet,
  deleteTimesheet,
  countNonSubmittedTimesheets,
  createSnapshot,
  updateTimesheetsWithSnapshot,
  validateTimesheetsForSubmission,
  updateTimesheetsWithSnapshotByIds,
  getTaskETC,
  updateTaskETC,
  getMaxSubmittedDate,
  getDatesWithTimesheets,
  getSnapshotsForPM,
  getSnapshotsForUser,
  findSnapshotById,
  getSnapshotDetails,
  getPreviewSubmission,
  getTimesheetsToReopen,
  reopenTimesheets,
  updateSnapshotStatus,
  getPool,
  getTMPlanningData,
  getTMTasksHoursTotals
};
