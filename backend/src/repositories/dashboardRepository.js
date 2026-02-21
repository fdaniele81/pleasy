import pool from "../db.js";

async function getProjectsWithTasks(pmUserId, companyId) {
  const query = `
    SELECT
      p.project_id,
      p.project_key,
      p.title as project_title,
      p.description as project_description,
      p.status_id,
      p.created_at as project_created_at,
      c.client_id,
      c.client_key,
      c.client_name,
      c.color as client_color,
      c.status_id as client_status_id,
      t.task_id,
      t.task_number,
      t.budget,
      t.initial_actual,
      t.owner_id,
      owner.full_name as owner_name,
      etc.etc_hours,
      COALESCE(t.initial_actual, 0) + COALESCE(timesheet_sum.total_actual, 0) as actual_hours
    FROM project_manager pm
    JOIN project p ON pm.project_id = p.project_id
    JOIN client c ON p.client_id = c.client_id
    LEFT JOIN task t ON t.project_id = p.project_id AND t.task_status_id != 'DELETED'
    LEFT JOIN users owner ON t.owner_id = owner.user_id
    LEFT JOIN task_etc etc ON t.task_id = etc.task_id
    LEFT JOIN (
      SELECT t.task_id, SUM(t.total_hours) as total_actual
      FROM task_timesheet t
      JOIN timesheet_snapshot s on t.snapshot_id = s.snapshot_id
      WHERE s.is_submitted = true
      GROUP BY task_id
    ) timesheet_sum ON t.task_id = timesheet_sum.task_id
    WHERE pm.user_id = $1
      AND c.company_id = $2
      AND c.status_id <> 'DELETED'
      AND p.status_id <> 'DELETED'
      AND p.project_type_id = 'PROJECT'
    ORDER BY c.client_name, p.project_key, t.task_number
  `;

  const result = await pool.query(query, [pmUserId, companyId]);
  return result.rows;
}

async function getTMActivities(companyId, pmUserId) {
  const query = `
    SELECT
      c.client_id,
      c.client_key,
      c.client_name,
      c.color as client_color,
      p.project_id,
      p.project_key,
      COALESCE(SUM(CASE
        WHEN ts.timesheet_date < CURRENT_DATE
        THEN ts.total_hours
        ELSE 0
      END), 0) as actual_hours,
      COALESCE(SUM(CASE
        WHEN ts.timesheet_date >= CURRENT_DATE
        THEN ts.total_hours
        ELSE 0
      END), 0) as etc_hours,
      COUNT(DISTINCT t.task_id) as task_count
    FROM project p
    JOIN client c ON p.client_id = c.client_id
    JOIN project_manager pm ON pm.project_id = p.project_id
    LEFT JOIN task t ON t.project_id = p.project_id AND t.task_status_id != 'DELETED'
    LEFT JOIN task_timesheet ts ON ts.task_id = t.task_id
    WHERE p.project_type_id = 'TM'
      AND p.status_id = 'ACTIVE'
      AND c.status_id = 'ACTIVE'
      AND c.company_id = $1
      AND pm.user_id = $2
    GROUP BY c.client_id, c.client_key, c.client_name, c.color, p.project_id, p.project_key
    ORDER BY c.client_name
  `;

  const result = await pool.query(query, [companyId, pmUserId]);
  return result.rows;
}

async function getEstimates(companyId, pmUserId) {
  const query = `
    SELECT
      e.estimate_id,
      e.title as estimate_title,
      e.client_id,
      e.status,
      e.created_at,
      e.updated_at,
      c.client_name,
      COALESCE(SUM(et.hours_development_input), 0) as total_input_hours
    FROM estimate e
    JOIN client c ON e.client_id = c.client_id
    LEFT JOIN estimate_task et ON e.estimate_id = et.estimate_id
    WHERE c.company_id = $1
      AND e.status != 'DELETED'
      AND $2 = ANY(e.project_managers)
    GROUP BY e.estimate_id, e.title, e.client_id,
             e.status, e.created_at, e.updated_at, c.client_name
    ORDER BY e.created_at DESC
  `;

  const result = await pool.query(query, [companyId, pmUserId]);
  return result.rows;
}

export {
  getProjectsWithTasks,
  getEstimates,
  getTMActivities,
};

export default {
  getProjectsWithTasks,
  getEstimates,
  getTMActivities,
};
