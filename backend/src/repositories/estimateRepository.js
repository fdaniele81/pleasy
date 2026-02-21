import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";

async function findClientById(clientId) {
  const result = await pool.query(
    `SELECT company_id, project_phases_config
     FROM client
     WHERE client_id = $1 AND status_id = 'ACTIVE'`,
    [clientId]
  );
  return result.rows[0] || null;
}

async function findProjectById(projectId) {
  const result = await pool.query(
    `SELECT project_id, client_id, company_id
     FROM project p
     JOIN client c ON c.client_id = p.client_id
     WHERE project_id = $1`,
    [projectId]
  );
  return result.rows[0] || null;
}

async function create(data) {
  const estimate_id = uuidv4();
  const result = await pool.query(
    `INSERT INTO estimate (
      estimate_id, client_id, title, description, project_id,
      pct_analysis, pct_development, pct_internal_test, pct_uat,
      pct_release, pct_pm, pct_startup, pct_documentation,
      contingency_percentage, created_by, status, estimate_phase_config, project_managers
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'DRAFT', $16, $17
    ) RETURNING *`,
    [
      estimate_id,
      data.client_id,
      data.title,
      data.description,
      data.project_id,
      data.pct_analysis,
      data.pct_development,
      data.pct_internal_test,
      data.pct_uat,
      data.pct_release,
      data.pct_pm,
      data.pct_startup,
      data.pct_documentation,
      data.contingency_percentage,
      data.created_by,
      data.estimate_phase_config ? JSON.stringify(data.estimate_phase_config) : '{}',
      data.project_managers || []
    ]
  );
  return result.rows[0];
}

async function findAll(filters = {}, user) {
  const { client_id, status, project_id } = filters;

  let query = `
    SELECT
      e.*,
      c.client_name,
      c.company_id,
      p.title as project_title,
      pd.project_key,
      u.full_name as created_by_name,
      (SELECT COUNT(*) FROM estimate_task WHERE estimate_id = e.estimate_id) as tasks_count,
      (SELECT COALESCE(SUM(hours_development_input), 0) FROM estimate_task WHERE estimate_id = e.estimate_id) as total_input_hours,
      (
        SELECT COALESCE(
          SUM(
            hours_analysis + hours_development + hours_internal_test +
            hours_uat + hours_release + hours_pm +
            hours_startup + hours_documentation
          ) * (1 + COALESCE(e.contingency_percentage, 0) / 100.0),
          0
        )
        FROM estimate_task
        WHERE estimate_id = e.estimate_id
      ) as total_hours_with_contingency
    FROM estimate e
    LEFT JOIN client c ON c.client_id = e.client_id
    LEFT JOIN project p ON p.project_id = e.project_id
    LEFT JOIN LATERAL (
      SELECT project_key
      FROM project_draft
      WHERE project_draft.estimate_id = e.estimate_id
      ORDER BY created_at DESC
      LIMIT 1
    ) pd ON true
    LEFT JOIN users u ON u.user_id = e.created_by
    WHERE e.status != 'DELETED'
  `;

  const queryParams = [];
  let paramCounter = 1;

  if (user.role_id === "PM") {
    query += ` AND c.company_id = $${paramCounter}`;
    queryParams.push(user.company_id);
    paramCounter++;
    query += ` AND $${paramCounter} = ANY(e.project_managers)`;
    queryParams.push(user.user_id);
    paramCounter++;
  }

  if (client_id) {
    query += ` AND e.client_id = $${paramCounter}`;
    queryParams.push(client_id);
    paramCounter++;
  }

  if (status) {
    query += ` AND e.status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }

  if (project_id) {
    query += ` AND e.project_id = $${paramCounter}`;
    queryParams.push(project_id);
    paramCounter++;
  }

  query += ` ORDER BY e.created_at DESC`;

  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function findById(estimateId) {
  const result = await pool.query(
    `SELECT
      e.*,
      c.client_name,
      c.company_id,
      c.project_phases_config,
      COALESCE(e.estimate_phase_config, c.project_phases_config, '{}'::jsonb) as effective_phase_config,
      p.title as project_title,
      u.full_name as created_by_name,
      u.email as created_by_email
    FROM estimate e
    LEFT JOIN client c ON c.client_id = e.client_id
    LEFT JOIN project p ON p.project_id = e.project_id
    LEFT JOIN users u ON u.user_id = e.created_by
    WHERE e.estimate_id = $1 AND e.status != 'DELETED'`,
    [estimateId]
  );
  return result.rows[0] || null;
}

async function findByIdMinimal(estimateId) {
  const result = await pool.query(
    `SELECT e.status, e.client_id, c.company_id,
            e.pct_analysis, e.pct_development, e.pct_internal_test,
            e.pct_uat, e.pct_release, e.pct_pm, e.pct_startup, e.pct_documentation
     FROM estimate e
     LEFT JOIN client c ON c.client_id = e.client_id
     WHERE e.estimate_id = $1 AND e.status != 'DELETED'`,
    [estimateId]
  );
  return result.rows[0] || null;
}

async function update(estimateId, data) {
  const updateFields = [];
  const updateValues = [];
  let paramCounter = 1;

  const allowedFields = [
    'title', 'description', 'project_id',
    'pct_analysis', 'pct_development', 'pct_internal_test', 'pct_uat',
    'pct_release', 'pct_pm', 'pct_startup', 'pct_documentation',
    'contingency_percentage', 'status', 'converted_at', 'estimate_phase_config',
    'project_managers'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = $${paramCounter}`);
      if (field === 'estimate_phase_config' && typeof data[field] === 'object') {
        updateValues.push(JSON.stringify(data[field]));
      } else {
        updateValues.push(data[field]);
      }
      paramCounter++;
    }
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateFields.push(`updated_at = NOW()`);
  updateValues.push(estimateId);

  const result = await pool.query(
    `UPDATE estimate
     SET ${updateFields.join(", ")}
     WHERE estimate_id = $${paramCounter}
     RETURNING *`,
    updateValues
  );

  return result.rows[0] || null;
}

async function deleteEstimate(estimateId) {
  const result = await pool.query(
    `UPDATE estimate SET status = 'DELETED', updated_at = NOW()
     WHERE estimate_id = $1 RETURNING *`,
    [estimateId]
  );
  return result.rows[0] || null;
}

async function findTasksByEstimateId(estimateId) {
  const result = await pool.query(
    `SELECT * FROM estimate_task
     WHERE estimate_id = $1
     ORDER BY created_at ASC`,
    [estimateId]
  );
  return result.rows;
}

async function createTask(data) {
  const task_id = uuidv4();
  const result = await pool.query(
    `INSERT INTO estimate_task (
      estimate_task_id, estimate_id, activity_name, activity_detail,
      hours_development_input, hours_analysis, hours_development,
      hours_internal_test, hours_uat, hours_release, hours_pm,
      hours_startup, hours_documentation, hours_contingency
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *`,
    [
      task_id,
      data.estimate_id,
      data.activity_name,
      data.activity_detail,
      data.hours_development_input,
      data.hours_analysis,
      data.hours_development,
      data.hours_internal_test,
      data.hours_uat,
      data.hours_release,
      data.hours_pm,
      data.hours_startup,
      data.hours_documentation,
      data.hours_contingency ?? null
    ]
  );
  return result.rows[0];
}

async function findTaskById(taskId, estimateId) {
  const result = await pool.query(
    `SELECT et.*, e.status, e.pct_analysis, e.pct_development, e.pct_internal_test,
            e.pct_uat, e.pct_release, e.pct_pm, e.pct_startup, e.pct_documentation,
            c.company_id
     FROM estimate_task et
     JOIN estimate e ON e.estimate_id = et.estimate_id
     JOIN client c ON c.client_id = e.client_id
     WHERE et.estimate_task_id = $1 AND et.estimate_id = $2`,
    [taskId, estimateId]
  );
  return result.rows[0] || null;
}

async function updateTask(taskId, data) {
  const updateFields = [];
  const updateValues = [];
  let paramCounter = 1;

  const allowedFields = [
    'activity_name', 'activity_detail', 'hours_development_input',
    'hours_analysis', 'hours_development', 'hours_internal_test',
    'hours_uat', 'hours_release', 'hours_pm', 'hours_startup',
    'hours_documentation', 'hours_contingency'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = $${paramCounter}`);
      updateValues.push(data[field]);
      paramCounter++;
    }
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateFields.push(`updated_at = NOW()`);
  updateValues.push(taskId);

  const result = await pool.query(
    `UPDATE estimate_task
     SET ${updateFields.join(", ")}
     WHERE estimate_task_id = $${paramCounter}
     RETURNING *`,
    updateValues
  );

  return result.rows[0] || null;
}

async function cloneEstimate(sourceEstimateId, newTitle, newProjectKey, userId) {
  await pool.query('BEGIN');
  try {
    const newEstimateId = uuidv4();

    await pool.query(
      `INSERT INTO estimate (
        estimate_id, client_id, title, description, project_id,
        pct_analysis, pct_development, pct_internal_test, pct_uat,
        pct_release, pct_pm, pct_startup, pct_documentation,
        contingency_percentage, created_by, status, estimate_phase_config, project_managers
      )
      SELECT
        $1, client_id, $2, description, NULL,
        pct_analysis, pct_development, pct_internal_test, pct_uat,
        pct_release, pct_pm, pct_startup, pct_documentation,
        contingency_percentage, created_by, 'DRAFT', estimate_phase_config, project_managers
      FROM estimate
      WHERE estimate_id = $3`,
      [newEstimateId, newTitle, sourceEstimateId]
    );

    const tasks = await pool.query(
      `SELECT * FROM estimate_task WHERE estimate_id = $1 ORDER BY created_at ASC`,
      [sourceEstimateId]
    );

    for (const task of tasks.rows) {
      const newTaskId = uuidv4();
      await pool.query(
        `INSERT INTO estimate_task (
          estimate_task_id, estimate_id, activity_name, activity_detail,
          hours_development_input, hours_analysis, hours_development,
          hours_internal_test, hours_uat, hours_release, hours_pm,
          hours_startup, hours_documentation, hours_contingency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newTaskId, newEstimateId, task.activity_name, task.activity_detail,
          task.hours_development_input, task.hours_analysis, task.hours_development,
          task.hours_internal_test, task.hours_uat, task.hours_release, task.hours_pm,
          task.hours_startup, task.hours_documentation, task.hours_contingency
        ]
      );
    }

    const drafts = await pool.query(
      `SELECT * FROM project_draft WHERE estimate_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [sourceEstimateId]
    );

    if (drafts.rows.length > 0) {
      const draft = drafts.rows[0];
      const newDraftId = uuidv4();
      await pool.query(
        `INSERT INTO project_draft (
          project_draft_id, estimate_id, client_id, project_key,
          title, description, status_id, project_details, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newDraftId, newEstimateId, draft.client_id,
          newProjectKey || draft.project_key,
          draft.title, draft.description, draft.status_id,
          draft.project_details, userId
        ]
      );

      const taskDrafts = await pool.query(
        `SELECT * FROM task_draft WHERE project_draft_id = $1 ORDER BY task_number ASC`,
        [draft.project_draft_id]
      );

      for (const td of taskDrafts.rows) {
        const newTaskDraftId = uuidv4();
        await pool.query(
          `INSERT INTO task_draft (
            task_draft_id, estimate_id, project_draft_id, task_number,
            project_id, external_key, title, description, task_status_id,
            owner_id, budget, task_details, start_date, end_date,
            initial_actual, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            newTaskDraftId, newEstimateId, newDraftId, td.task_number,
            td.project_id, td.external_key, td.title, td.description, td.task_status_id,
            td.owner_id, td.budget, td.task_details, td.start_date, td.end_date,
            td.initial_actual, userId
          ]
        );
      }
    }

    await pool.query('COMMIT');

    const result = await pool.query(
      `SELECT * FROM estimate WHERE estimate_id = $1`,
      [newEstimateId]
    );
    return result.rows[0];
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

async function deleteTask(taskId) {
  const result = await pool.query(
    'DELETE FROM estimate_task WHERE estimate_task_id = $1 RETURNING *',
    [taskId]
  );
  return result.rows[0] || null;
}

async function findDraftProjectByClientId(clientId, projectKey) {
  const result = await pool.query(
    `SELECT project_id FROM project
     WHERE client_id = $1 AND project_key = $2 AND status_id = 'DELETED'`,
    [clientId, projectKey.toUpperCase()]
  );
  return result.rows[0] || null;
}

async function findAnyDraftProjectByClientId(clientId) {
  const result = await pool.query(
    `SELECT p.*, json_agg(DISTINCT jsonb_build_object('user_id', pm.user_id)) FILTER (WHERE pm.user_id IS NOT NULL) as project_managers
     FROM project p
     LEFT JOIN project_manager pm ON p.project_id = pm.project_id
     WHERE p.client_id = $1 AND p.status_id = 'DELETED'
     GROUP BY p.project_id LIMIT 1`,
    [clientId]
  );
  return result.rows[0] || null;
}

async function createDraftProject(data) {
  const project_id = uuidv4();
  await pool.query(
    `INSERT INTO project (project_id, client_id, project_key, title, status_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'DELETED', NOW(), NOW())`,
    [project_id, data.client_id, data.project_key.toUpperCase(), data.title]
  );
  return project_id;
}

async function updateDraftProject(projectId, data) {
  await pool.query(
    `UPDATE project SET title = $1, updated_at = NOW() WHERE project_id = $2`,
    [data.title, projectId]
  );
}

async function activateDraftProject(projectId, title) {
  await pool.query(
    `UPDATE project
     SET status_id = 'ACTIVE',
         title = $2,
         updated_at = NOW()
     WHERE project_id = $1`,
    [projectId, title]
  );
}

async function createActiveProject(data) {
  const project_id = uuidv4();
  await pool.query(
    `INSERT INTO project (project_id, client_id, project_key, title, status_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
    [project_id, data.client_id, data.project_key.toUpperCase(), data.title]
  );
  return project_id;
}

async function deleteProjectManagers(projectId) {
  await pool.query('DELETE FROM project_manager WHERE project_id = $1', [projectId]);
}

async function addProjectManager(projectId, userId) {
  await pool.query(
    `INSERT INTO project_manager (project_id, user_id, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())`,
    [projectId, userId]
  );
}

async function findUserById(userId, companyId) {
  const result = await pool.query(
    `SELECT user_id FROM users WHERE user_id = $1 AND company_id = $2 AND role_id IN ('PM', 'ADMIN')`,
    [userId, companyId]
  );
  return result.rows[0] || null;
}

async function deleteProjectTasks(projectId) {
  await pool.query('DELETE FROM task_etc WHERE task_id IN (SELECT task_id FROM task WHERE project_id = $1)', [projectId]);
  await pool.query('DELETE FROM task WHERE project_id = $1', [projectId]);
  await pool.query('DELETE FROM task_sequence WHERE project_id = $1', [projectId]);
}

async function findTasksByProjectId(projectId) {
  const result = await pool.query(
    `SELECT * FROM task WHERE project_id = $1 ORDER BY task_number`,
    [projectId]
  );
  return result.rows;
}

async function createProjectTask(data) {
  const task_id = uuidv4();

  const seqResult = await pool.query(
    `INSERT INTO task_sequence (project_id, last_task_number)
     VALUES ($1, 1)
     ON CONFLICT (project_id)
     DO UPDATE SET last_task_number = task_sequence.last_task_number + 1
     RETURNING last_task_number`,
    [data.project_id]
  );
  const taskNumber = seqResult.rows[0].last_task_number;

  await pool.query(
    `INSERT INTO task (task_id, task_number, project_id, title, description, budget, task_status_id, initial_actual, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'TODO', 0.00, NOW(), NOW())`,
    [task_id, taskNumber, data.project_id, data.title, data.description || '', data.budget || 0]
  );

  const etc_id = uuidv4();
  await pool.query(
    `INSERT INTO task_etc (etc_id, task_id, company_id, etc_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [etc_id, task_id, data.company_id, data.budget || 0]
  );

  return task_id;
}

export {
  findClientById,
  findProjectById,
  create,
  findAll,
  findById,
  findByIdMinimal,
  update,
  deleteEstimate,
  findTasksByEstimateId,
  createTask,
  findTaskById,
  updateTask,
  deleteTask,
  cloneEstimate,
  findDraftProjectByClientId,
  findAnyDraftProjectByClientId,
  createDraftProject,
  updateDraftProject,
  activateDraftProject,
  createActiveProject,
  deleteProjectManagers,
  addProjectManager,
  findUserById,
  deleteProjectTasks,
  findTasksByProjectId,
  createProjectTask,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};

export default {
  findClientById,
  findProjectById,
  create,
  findAll,
  findById,
  findByIdMinimal,
  update,
  deleteEstimate,
  findTasksByEstimateId,
  createTask,
  findTaskById,
  updateTask,
  deleteTask,
  cloneEstimate,
  findDraftProjectByClientId,
  findAnyDraftProjectByClientId,
  createDraftProject,
  updateDraftProject,
  activateDraftProject,
  createActiveProject,
  deleteProjectManagers,
  addProjectManager,
  findUserById,
  deleteProjectTasks,
  findTasksByProjectId,
  createProjectTask,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
