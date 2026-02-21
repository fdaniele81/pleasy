import dashboardRepository from "../repositories/dashboardRepository.js";

async function getProjects(user) {
  const rows = await dashboardRepository.getProjectsWithTasks(user.user_id, user.company_id);

  const projectsMap = new Map();
  const allOwnersMap = new Map();

  rows.forEach((row) => {
    const projectId = row.project_id;

    if (!projectsMap.has(projectId)) {
      projectsMap.set(projectId, {
        project_id: row.project_id,
        project_key: row.project_key,
        project_title: row.project_title,
        description: row.project_description,
        status_id: row.status_id,
        created_at: row.project_created_at,
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_color: row.client_color,
        client_status_id: row.client_status_id,
        tasks: [],
        owners: new Set(),
      });
    }

    if (row.task_id) {
      projectsMap.get(projectId).tasks.push({
        task_id: row.task_id,
        task_number: row.task_number,
        budget: parseFloat(row.budget) || 0,
        initial_actual: parseFloat(row.initial_actual) || 0,
        actual: parseFloat(row.actual_hours) || 0,
        etc_hours: parseFloat(row.etc_hours) || 0,
        owner_id: row.owner_id,
      });

      if (row.owner_id) {
        projectsMap.get(projectId).owners.add(row.owner_id);
        if (!allOwnersMap.has(row.owner_id)) {
          allOwnersMap.set(row.owner_id, {
            user_id: row.owner_id,
            full_name: row.owner_name,
          });
        }
      }
    }
  });

  const projects = Array.from(projectsMap.values()).map((project) => {
    const tasks = project.tasks;

    const project_budget = tasks.reduce((sum, t) => sum + t.budget, 0);
    const project_actual = tasks.reduce((sum, t) => sum + t.actual, 0);
    const project_etc = tasks.reduce((sum, t) => sum + t.etc_hours, 0);
    const project_eac = project_actual + project_etc;
    const project_delta = project_budget - project_eac;
    const project_progress = project_eac > 0 ? (project_actual / project_eac) * 100 : 0;

    return {
      project_id: project.project_id,
      project_key: project.project_key,
      project_title: project.project_title,
      description: project.description,
      status_id: project.status_id,
      created_at: project.created_at,
      client_id: project.client_id,
      client_key: project.client_key,
      client_name: project.client_name,
      client_color: project.client_color,
      client_status_id: project.client_status_id,
      budget: Math.round(project_budget * 10) / 10,
      actual: Math.round(project_actual * 10) / 10,
      etc: Math.round(project_etc * 10) / 10,
      eac: Math.round(project_eac * 10) / 10,
      delta: Math.round(project_delta * 10) / 10,
      progress: Math.round(project_progress * 10) / 10,
      owner_ids: Array.from(project.owners),
      tasks: tasks,
    };
  });

  const owners = Array.from(allOwnersMap.values()).sort((a, b) =>
    (a.full_name || '').localeCompare(b.full_name || '')
  );

  return { projects, owners };
}

async function getEstimates(user) {
  return await dashboardRepository.getEstimates(user.company_id, user.user_id);
}

async function getTMActivities(user) {
  const rows = await dashboardRepository.getTMActivities(user.company_id, user.user_id);

  const tmActivities = rows.map(row => ({
    client_id: row.client_id,
    client_key: row.client_key,
    client_name: row.client_name,
    client_color: row.client_color,
    project_id: row.project_id,
    project_key: row.project_key,
    actual_hours: Math.round(parseFloat(row.actual_hours) * 10) / 10,
    etc_hours: Math.round(parseFloat(row.etc_hours) * 10) / 10,
    total_hours: Math.round((parseFloat(row.actual_hours) + parseFloat(row.etc_hours)) * 10) / 10,
    task_count: parseInt(row.task_count) || 0,
  }));

  const totals = tmActivities.reduce((acc, item) => {
    acc.actual_hours += item.actual_hours;
    acc.etc_hours += item.etc_hours;
    acc.total_hours += item.total_hours;
    return acc;
  }, { actual_hours: 0, etc_hours: 0, total_hours: 0, client_count: tmActivities.length });

  totals.actual_hours = Math.round(totals.actual_hours * 10) / 10;
  totals.etc_hours = Math.round(totals.etc_hours * 10) / 10;
  totals.total_hours = Math.round(totals.total_hours * 10) / 10;

  return { tmActivities, totals };
}

export {
  getProjects,
  getEstimates,
  getTMActivities,
};

export default {
  getProjects,
  getEstimates,
  getTMActivities,
};
