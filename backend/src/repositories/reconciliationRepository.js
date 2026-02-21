import db from "../db.js";

function sanitizeIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid identifier: must be a non-empty string');
  }

  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '_');

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
    throw new Error('Invalid identifier format');
  }

  if (sanitized.length > 63) {
    throw new Error('Identifier too long (max 63 characters)');
  }

  return sanitized;
}

function escapeIdentifier(identifier) {
  const sanitized = sanitizeIdentifier(identifier);
  return `"${sanitized.replace(/"/g, '""')}"`;
}

async function getTemplate(pmId, companyId) {
  const query = `
    SELECT
      template_id, template_name, staging_table_name, column_names, sql_query,
      TO_CHAR(last_upload_date, 'YYYY-MM-DD HH24:MI:SS') as last_upload_date,
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
      TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
    FROM pm_reconciliation_template
    WHERE pm_id = $1 AND company_id = $2`;

  const result = await db.query(query, [pmId, companyId]);
  return result.rows[0] || null;
}

async function getTemplateByPmId(pmId, client) {
  const conn = client || db;
  const result = await conn.query(
    `SELECT template_id, staging_table_name, column_names, sql_query
     FROM pm_reconciliation_template WHERE pm_id = $1`,
    [pmId]
  );
  return result.rows[0] || null;
}

async function tableExists(tableName, client) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function dropTable(tableName, client) {
  const safeName = escapeIdentifier(tableName);
  await client.query(`DROP TABLE IF EXISTS ${safeName}`);
}

async function createTable(sql, client) {
  await client.query(sql);
}

async function dropView(viewName, client) {
  const safeName = escapeIdentifier(viewName);
  await client.query(`DROP VIEW IF EXISTS ${safeName}`);
}

async function createUsersView(viewName, companyId, client) {
  const safeName = escapeIdentifier(viewName);

  if (!companyId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    throw new Error('Invalid company_id format');
  }

  await client.query(`
    CREATE VIEW ${safeName} AS
    SELECT user_id, email, full_name, role_id, company_id
    FROM users WHERE company_id = '${companyId}'
  `);
}

async function insertIntoStaging(sql, values, client) {
  await client.query(sql, values);
}

async function truncateStaging(tableName, client) {
  const safeName = escapeIdentifier(tableName);
  await client.query(`TRUNCATE TABLE ${safeName}`);
}

async function createTemplate(data, client) {
  const result = await client.query(
    `INSERT INTO pm_reconciliation_template (pm_id, company_id, template_name, staging_table_name, column_names, last_upload_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING template_id, template_name, staging_table_name`,
    [data.pmId, data.companyId, data.templateName, data.stagingTableName, data.columnNames]
  );
  return result.rows[0];
}

async function updateTemplateWithQuery(pmId, templateName, sqlQuery, client) {
  const result = await client.query(
    `UPDATE pm_reconciliation_template
     SET template_name = $1, sql_query = $2
     WHERE pm_id = $3
     RETURNING template_id, template_name, staging_table_name, column_names, sql_query`,
    [templateName, sqlQuery, pmId]
  );
  return result.rows[0];
}

async function updateTemplateWithColumns(data, client) {
  const result = await client.query(
    `UPDATE pm_reconciliation_template
     SET template_name = $1, staging_table_name = $2, column_names = $3, sql_query = $4
     WHERE pm_id = $5
     RETURNING template_id, template_name, staging_table_name, column_names, sql_query`,
    [data.templateName, data.stagingTableName, data.columnNames, data.sqlQuery, data.pmId]
  );
  return result.rows[0];
}

async function createTemplateWithQuery(data, client) {
  const result = await client.query(
    `INSERT INTO pm_reconciliation_template (pm_id, company_id, template_name, staging_table_name, column_names, sql_query)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING template_id, template_name, staging_table_name, column_names, sql_query`,
    [data.pmId, data.companyId, data.templateName, data.stagingTableName, data.columnNames, data.sqlQuery]
  );
  return result.rows[0];
}

async function updateLastUploadDate(pmId, client) {
  await client.query(
    "UPDATE pm_reconciliation_template SET last_upload_date = CURRENT_TIMESTAMP WHERE pm_id = $1",
    [pmId]
  );
}

async function executeQuery(query, client) {
  return client.query(query);
}

async function deleteReconciliationData(pmId, client) {
  await client.query("DELETE FROM timesheet_reconciliation WHERE pm_id = $1", [pmId]);
}

async function insertReconciliation(data, client) {
  await client.query(
    `INSERT INTO timesheet_reconciliation (company_id, external_key, total_hours, user_id, pm_id, timestamp_reconciliation)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
    [data.companyId, data.externalKey, data.totalHours, data.userId, data.pmId]
  );
}

async function deleteTemplate(pmId, client) {
  await client.query("DELETE FROM pm_reconciliation_template WHERE pm_id = $1", [pmId]);
}

async function getSyncStatus(companyId, pmId) {
  const query = `
    WITH all_external_keys AS (
      SELECT DISTINCT t.external_key
      FROM task t
      INNER JOIN project p ON t.project_id = p.project_id
      INNER JOIN client c ON p.client_id = c.client_id
      INNER JOIN project_manager pma ON p.project_id = pma.project_id AND pma.user_id = $2
      WHERE t.external_key IS NOT NULL
        AND t.external_key != ''
        AND c.company_id = $1
        AND p.status_id != 'DELETED'
        AND p.project_type_id = 'PROJECT'
        AND t.task_status_id != 'DELETED'
      UNION
      SELECT DISTINCT ts.external_key
      FROM task_timesheet ts
      INNER JOIN task t ON ts.task_id = t.task_id
      INNER JOIN project p ON t.project_id = p.project_id
      INNER JOIN client c ON p.client_id = c.client_id
      INNER JOIN project_manager pma ON p.project_id = pma.project_id AND pma.user_id = $2
      WHERE ts.external_key IS NOT NULL
        AND ts.external_key != ''
        AND c.company_id = $1
        AND p.status_id != 'DELETED'
        AND p.project_type_id = 'TM'
        AND p.reconciliation_required = true
        AND t.task_status_id != 'DELETED'
    ),
    reconciliation_data AS (
      SELECT
        r.external_key, r.user_id, u.full_name as user_name,
        r.total_hours as reconciliation_hours,
        TO_CHAR(r.timestamp_reconciliation, 'YYYY-MM-DD HH24:MI:SS') as last_sync
      FROM timesheet_reconciliation r
      LEFT JOIN users u ON r.user_id = u.user_id
      INNER JOIN all_external_keys aek ON r.external_key = aek.external_key
      WHERE r.pm_id = $2 AND r.company_id = $1
    ),
    initial_actual_data AS (
      SELECT
        t.external_key, t.owner_id as user_id, u.full_name as user_name,
        SUM(t.initial_actual) as initial_actual_hours
      FROM task t
      INNER JOIN project p ON t.project_id = p.project_id
      INNER JOIN client c ON p.client_id = c.client_id
      INNER JOIN project_manager pma ON p.project_id = pma.project_id AND pma.user_id = $2
      LEFT JOIN users u ON t.owner_id = u.user_id
      WHERE t.external_key IS NOT NULL AND t.external_key != ''
        AND t.owner_id IS NOT NULL AND c.company_id = $1
        AND COALESCE(t.initial_actual, 0) > 0
        AND t.task_status_id != 'DELETED'
        AND p.status_id != 'DELETED'
        AND p.project_type_id = 'PROJECT'
      GROUP BY t.external_key, t.owner_id, u.full_name
    ),
    timesheet_data_project AS (
      SELECT
        t.external_key, ts.user_id, u.full_name as user_name,
        SUM(ts.total_hours) as timesheet_hours
      FROM task t
      INNER JOIN project p ON t.project_id = p.project_id
      INNER JOIN client c ON p.client_id = c.client_id
      INNER JOIN project_manager pma ON p.project_id = pma.project_id AND pma.user_id = $2
      INNER JOIN task_timesheet ts ON ts.task_id = t.task_id
      INNER JOIN timesheet_snapshot snap ON ts.snapshot_id = snap.snapshot_id AND snap.is_submitted = true
      LEFT JOIN users u ON ts.user_id = u.user_id
      WHERE t.external_key IS NOT NULL AND t.external_key != ''
        AND p.status_id != 'DELETED' AND c.company_id = $1
        AND t.task_status_id != 'DELETED'
        AND p.project_type_id = 'PROJECT'
      GROUP BY t.external_key, ts.user_id, u.full_name
    ),
    timesheet_data_tm AS (
      SELECT
        ts.external_key, ts.user_id, u.full_name as user_name,
        SUM(ts.total_hours) as timesheet_hours
      FROM task_timesheet ts
      INNER JOIN task t ON ts.task_id = t.task_id
      INNER JOIN project p ON t.project_id = p.project_id
      INNER JOIN client c ON p.client_id = c.client_id
      INNER JOIN project_manager pma ON p.project_id = pma.project_id AND pma.user_id = $2
      INNER JOIN timesheet_snapshot snap ON ts.snapshot_id = snap.snapshot_id AND snap.is_submitted = true
      LEFT JOIN users u ON ts.user_id = u.user_id
      WHERE ts.external_key IS NOT NULL AND ts.external_key != ''
        AND p.status_id != 'DELETED' AND c.company_id = $1
        AND t.task_status_id != 'DELETED'
        AND p.project_type_id = 'TM'
        AND p.reconciliation_required = true
      GROUP BY ts.external_key, ts.user_id, u.full_name
    ),
    timesheet_data AS (
      SELECT external_key, user_id, user_name, timesheet_hours FROM timesheet_data_project
      UNION ALL
      SELECT external_key, user_id, user_name, timesheet_hours FROM timesheet_data_tm
    ),
    combined_actual_data AS (
      SELECT
        COALESCE(ia.external_key, ts.external_key) as external_key,
        COALESCE(ia.user_id, ts.user_id) as user_id,
        COALESCE(ia.user_name, ts.user_name) as user_name,
        COALESCE(ia.initial_actual_hours, 0) + COALESCE(ts.timesheet_hours, 0) as actual_hours
      FROM initial_actual_data ia
      FULL OUTER JOIN timesheet_data ts ON ia.external_key = ts.external_key AND ia.user_id = ts.user_id
    )
    SELECT
      COALESCE(r.external_key, c.external_key) as external_key,
      COALESCE(r.user_id, c.user_id) as user_id,
      COALESCE(r.user_name, c.user_name) as user_name,
      COALESCE(c.actual_hours, 0) as actual_hours,
      COALESCE(r.reconciliation_hours, 0) as reconciliation_hours,
      r.last_sync
    FROM reconciliation_data r
    FULL OUTER JOIN combined_actual_data c ON r.external_key = c.external_key AND r.user_id = c.user_id
    ORDER BY COALESCE(r.external_key, c.external_key), COALESCE(r.user_name, c.user_name)`;

  const result = await db.query(query, [companyId, pmId]);
  return result.rows;
}

async function getUsersFromView(viewName) {
  const safeName = escapeIdentifier(viewName);
  const result = await db.query(`SELECT * FROM ${safeName} ORDER BY full_name LIMIT 100`);
  return result.rows;
}

async function getStagingData(tableName, client) {
  const safeName = escapeIdentifier(tableName);
  const result = await client.query(`SELECT * FROM ${safeName} LIMIT 100`);
  return { rows: result.rows, fields: result.fields };
}

async function checkUsersCompany(userIds, companyId, client) {
  const result = await client.query(
    `SELECT COUNT(*) as wrong_company FROM users WHERE user_id = ANY($1) AND company_id != $2`,
    [userIds, companyId]
  );
  return parseInt(result.rows[0].wrong_company);
}

function getPool() {
  return db.pool;
}

export {
  getTemplate,
  getTemplateByPmId,
  tableExists,
  dropTable,
  createTable,
  dropView,
  createUsersView,
  insertIntoStaging,
  truncateStaging,
  createTemplate,
  updateTemplateWithQuery,
  updateTemplateWithColumns,
  createTemplateWithQuery,
  updateLastUploadDate,
  executeQuery,
  deleteReconciliationData,
  insertReconciliation,
  deleteTemplate,
  getSyncStatus,
  getUsersFromView,
  getStagingData,
  checkUsersCompany,
  getPool
};

export default {
  getTemplate,
  getTemplateByPmId,
  tableExists,
  dropTable,
  createTable,
  dropView,
  createUsersView,
  insertIntoStaging,
  truncateStaging,
  createTemplate,
  updateTemplateWithQuery,
  updateTemplateWithColumns,
  createTemplateWithQuery,
  updateLastUploadDate,
  executeQuery,
  deleteReconciliationData,
  insertReconciliation,
  deleteTemplate,
  getSyncStatus,
  getUsersFromView,
  getStagingData,
  checkUsersCompany,
  getPool
};
