import estimateRepository from "../repositories/estimateRepository.js";
import { DEFAULT_PROJECT_PHASES_CONFIG, isValidConfig } from "../config/projectPhasesConfig.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import { serviceError } from "../utils/errorHandler.js";

function getDefaultPercentages(config) {
  const safeConfig = isValidConfig(config) ? config : DEFAULT_PROJECT_PHASES_CONFIG;

  return {
    pct_analysis: safeConfig.analysis?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.analysis.e2e_percentage,
    pct_development: safeConfig.development?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.development.e2e_percentage,
    pct_internal_test: safeConfig.internal_test?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.internal_test.e2e_percentage,
    pct_uat: safeConfig.uat?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.uat.e2e_percentage,
    pct_release: safeConfig.release?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.release.e2e_percentage,
    pct_pm: safeConfig.pm?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.pm.e2e_percentage,
    pct_startup: safeConfig.startup?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.startup.e2e_percentage,
    pct_documentation: safeConfig.documentation?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.documentation.e2e_percentage,
    contingency_percentage: safeConfig.contingency?.e2e_percentage ?? DEFAULT_PROJECT_PHASES_CONFIG.contingency.e2e_percentage
  };
}

async function createEstimate(data, user) {
  const client = await estimateRepository.findClientById(data.client_id);
  if (!client) {
    throw serviceError("Cliente non trovato", 404);
  }

  checkCompanyAccess(user, client.company_id);

  const defaults = getDefaultPercentages(client.project_phases_config);

  if (data.project_id) {
    const project = await estimateRepository.findProjectById(data.project_id);
    if (!project) {
      throw serviceError("Progetto non trovato", 404);
    }
    if (project.client_id !== data.client_id) {
      throw serviceError("Il progetto non appartiene al cliente specificato", 400);
    }
  }

  const estimateData = {
    client_id: data.client_id,
    title: data.title,
    description: data.description,
    project_id: data.project_id,
    pct_analysis: data.pct_analysis ?? defaults.pct_analysis,
    pct_development: data.pct_development ?? defaults.pct_development,
    pct_internal_test: data.pct_internal_test ?? defaults.pct_internal_test,
    pct_uat: data.pct_uat ?? defaults.pct_uat,
    pct_release: data.pct_release ?? defaults.pct_release,
    pct_pm: data.pct_pm ?? defaults.pct_pm,
    pct_startup: data.pct_startup ?? defaults.pct_startup,
    pct_documentation: data.pct_documentation ?? defaults.pct_documentation,
    contingency_percentage: data.contingency_percentage ?? defaults.contingency_percentage,
    created_by: user.user_id,
    project_managers: data.project_managers || [user.user_id],
    estimate_phase_config: {
      ...(client.project_phases_config || {}),
      elapsed_days: client.project_phases_config?.elapsed_days ?? 10
    }
  };

  const estimate = await estimateRepository.create(estimateData);

  return {
    estimate,
    companyId: client.company_id
  };
}

async function getEstimates(filters, user) {
  return estimateRepository.findAll(filters, user);
}

async function getEstimateById(estimateId, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  const tasks = await estimateRepository.findTasksByEstimateId(estimateId);

  const totals = calculateTotals(tasks, estimate.contingency_percentage);

  return {
    ...estimate,
    tasks,
    totals
  };
}

function calculateTotals(tasks, contingencyPercentage) {
  const totals = {
    total_hours_input: 0,
    total_hours_analysis: 0,
    total_hours_development: 0,
    total_hours_internal_test: 0,
    total_hours_uat: 0,
    total_hours_release: 0,
    total_hours_pm: 0,
    total_hours_startup: 0,
    total_hours_documentation: 0,
    total_hours_all: 0
  };

  tasks.forEach(task => {
    totals.total_hours_input += parseFloat(task.hours_development_input || 0);
    totals.total_hours_analysis += parseFloat(task.hours_analysis || 0);
    totals.total_hours_development += parseFloat(task.hours_development || 0);
    totals.total_hours_internal_test += parseFloat(task.hours_internal_test || 0);
    totals.total_hours_uat += parseFloat(task.hours_uat || 0);
    totals.total_hours_release += parseFloat(task.hours_release || 0);
    totals.total_hours_pm += parseFloat(task.hours_pm || 0);
    totals.total_hours_startup += parseFloat(task.hours_startup || 0);
    totals.total_hours_documentation += parseFloat(task.hours_documentation || 0);
  });

  totals.total_hours_all =
    totals.total_hours_analysis +
    totals.total_hours_development +
    totals.total_hours_internal_test +
    totals.total_hours_uat +
    totals.total_hours_release +
    totals.total_hours_pm +
    totals.total_hours_startup +
    totals.total_hours_documentation;

  const contingency_hours = (totals.total_hours_all * parseFloat(contingencyPercentage || 0)) / 100;
  totals.total_hours_with_contingency = totals.total_hours_all + contingency_hours;
  totals.contingency_hours = contingency_hours;

  return totals;
}

async function updateEstimate(estimateId, data, user) {
  const estimate = await estimateRepository.findByIdMinimal(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  if (data.project_id && data.project_id !== null) {
    const project = await estimateRepository.findProjectById(data.project_id);
    if (!project) {
      throw serviceError("Progetto non trovato", 404);
    }
  }

  return estimateRepository.update(estimateId, data);
}

async function deleteEstimate(estimateId, user) {
  const estimate = await estimateRepository.findByIdMinimal(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  return estimateRepository.deleteEstimate(estimateId);
}

async function createTask(estimateId, data, user) {
  const estimate = await estimateRepository.findByIdMinimal(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  const hours_analysis = Math.round((data.hours_development_input * parseFloat(estimate.pct_analysis)) / 100);
  const hours_development = Math.round((data.hours_development_input * parseFloat(estimate.pct_development)) / 100);
  const hours_internal_test = Math.round((data.hours_development_input * parseFloat(estimate.pct_internal_test)) / 100);
  const hours_uat = Math.round((data.hours_development_input * parseFloat(estimate.pct_uat)) / 100);
  const hours_release = Math.round((data.hours_development_input * parseFloat(estimate.pct_release)) / 100);
  const hours_pm = Math.round((data.hours_development_input * parseFloat(estimate.pct_pm)) / 100);
  const hours_startup = Math.round((data.hours_development_input * parseFloat(estimate.pct_startup)) / 100);
  const hours_documentation = Math.round((data.hours_development_input * parseFloat(estimate.pct_documentation)) / 100);

  const taskData = {
    estimate_id: estimateId,
    activity_name: data.activity_name,
    activity_detail: data.activity_detail,
    hours_development_input: data.hours_development_input,
    hours_analysis,
    hours_development,
    hours_internal_test,
    hours_uat,
    hours_release,
    hours_pm,
    hours_startup,
    hours_documentation,
    hours_contingency: data.hours_contingency ?? null
  };

  return estimateRepository.createTask(taskData);
}

async function updateTask(estimateId, taskId, data, user) {
  const task = await estimateRepository.findTaskById(taskId, estimateId);
  if (!task) {
    throw serviceError("Task non trovato", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return estimateRepository.updateTask(taskId, data);
}

async function deleteTask(estimateId, taskId, user) {
  const task = await estimateRepository.findTaskById(taskId, estimateId);
  if (!task) {
    throw serviceError("Task non trovato", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return estimateRepository.deleteTask(taskId);
}

async function cloneEstimate(estimateId, newTitle, projectKey, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  return estimateRepository.cloneEstimate(estimateId, newTitle, projectKey, user.user_id);
}

async function simpleConvert(estimateId, projectId, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  if (estimate.status === 'CONVERTED') {
    throw serviceError("La stima è già stata convertita", 400);
  }

  checkCompanyAccess(user, estimate.company_id);

  const project = await estimateRepository.findProjectById(projectId);
  if (!project) {
    throw serviceError("Progetto non trovato", 404);
  }

  if (project.client_id !== estimate.client_id) {
    throw serviceError("Il progetto deve appartenere allo stesso cliente della stima", 400);
  }

  return estimateRepository.update(estimateId, {
    status: 'CONVERTED',
    project_id: projectId,
    converted_at: new Date()
  });
}

async function saveDraftProject(estimateId, data, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  if (estimate.status === 'CONVERTED') {
    throw serviceError("La stima è già stata convertita", 400);
  }

  checkCompanyAccess(user, estimate.company_id);

  await estimateRepository.beginTransaction();

  try {
    let project_id;

    const existingDraft = await estimateRepository.findDraftProjectByClientId(
      estimate.client_id,
      data.project_key
    );

    if (existingDraft) {
      project_id = existingDraft.project_id;
      await estimateRepository.updateDraftProject(project_id, { title: data.project_title });
      await estimateRepository.deleteProjectManagers(project_id);
      await estimateRepository.deleteProjectTasks(project_id);
    } else {
      project_id = await estimateRepository.createDraftProject({
        client_id: estimate.client_id,
        project_key: data.project_key,
        title: data.project_title
      });
    }

    for (const pmUserId of data.project_managers) {
      await estimateRepository.addProjectManager(project_id, pmUserId);
    }

    if (data.tasks?.length > 0) {
      for (const taskData of data.tasks) {
        await estimateRepository.createProjectTask({
          project_id,
          title: taskData.title,
          description: taskData.description,
          budget: taskData.budget,
          company_id: estimate.company_id
        });
      }
    }

    await estimateRepository.commitTransaction();

    return {
      project_id,
      tasks_created: data.tasks?.length || 0
    };

  } catch (err) {
    await estimateRepository.rollbackTransaction();
    throw err;
  }
}

async function getDraftProject(estimateId, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  const draft = await estimateRepository.findAnyDraftProjectByClientId(estimate.client_id);

  if (!draft) {
    return { has_draft: false };
  }

  const tasks = await estimateRepository.findTasksByProjectId(draft.project_id);

  return {
    has_draft: true,
    draft: { ...draft, tasks }
  };
}

async function convertToProject(estimateId, data, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  if (estimate.status === 'CONVERTED') {
    throw serviceError("La stima è già stata convertita in progetto", 400);
  }

  checkCompanyAccess(user, estimate.company_id);

  await estimateRepository.beginTransaction();

  try {
    let project_id;

    const existingDraft = await estimateRepository.findDraftProjectByClientId(
      estimate.client_id,
      data.project_key
    );

    if (existingDraft) {
      project_id = existingDraft.project_id;
      await estimateRepository.activateDraftProject(project_id, data.project_title);
      await estimateRepository.deleteProjectManagers(project_id);
      await estimateRepository.deleteProjectTasks(project_id);
    } else {
      project_id = await estimateRepository.createActiveProject({
        client_id: estimate.client_id,
        project_key: data.project_key,
        title: data.project_title
      });
    }

    for (const pmUserId of data.project_managers) {
      const pm = await estimateRepository.findUserById(pmUserId, estimate.company_id);
      if (!pm) {
        throw serviceError(`Project Manager non trovato o non autorizzato: ${pmUserId}`, 400);
      }
      await estimateRepository.addProjectManager(project_id, pmUserId);
    }

    for (const taskData of data.tasks) {
      await estimateRepository.createProjectTask({
        project_id,
        title: taskData.title,
        description: taskData.description,
        budget: taskData.budget,
        company_id: estimate.company_id
      });
    }

    await estimateRepository.update(estimateId, {
      status: 'CONVERTED',
      project_id,
      converted_at: new Date()
    });

    await estimateRepository.commitTransaction();

    return {
      project_id,
      tasks_created: data.tasks.length
    };

  } catch (err) {
    await estimateRepository.rollbackTransaction();
    throw err;
  }
}

async function calculateFTE(estimateId, data, user) {
  const estimate = await estimateRepository.findById(estimateId);
  if (!estimate) {
    throw serviceError("Stima non trovata", 404);
  }

  checkCompanyAccess(user, estimate.company_id);

  const config = isValidConfig(estimate.effective_phase_config)
    ? estimate.effective_phase_config
    : DEFAULT_PROJECT_PHASES_CONFIG;

  const tasks = await estimateRepository.findTasksByEstimateId(estimateId);

  const totals = {
    hours_analysis: 0,
    hours_development: 0,
    hours_internal_test: 0,
    hours_uat: 0,
    hours_release: 0,
    hours_pm: 0,
    hours_startup: 0,
    hours_documentation: 0
  };

  tasks.forEach(task => {
    totals.hours_analysis += parseFloat(task.hours_analysis || 0);
    totals.hours_development += parseFloat(task.hours_development || 0);
    totals.hours_internal_test += parseFloat(task.hours_internal_test || 0);
    totals.hours_uat += parseFloat(task.hours_uat || 0);
    totals.hours_release += parseFloat(task.hours_release || 0);
    totals.hours_pm += parseFloat(task.hours_pm || 0);
    totals.hours_startup += parseFloat(task.hours_startup || 0);
    totals.hours_documentation += parseFloat(task.hours_documentation || 0);
  });

  const num_intervals = 10;
  const days_per_interval = data.total_days / num_intervals;
  const working_hours_per_interval = days_per_interval * 8;

  const intervals = [];
  for (let i = 1; i <= num_intervals; i++) {
    intervals.push({
      interval_number: i,
      days: days_per_interval,
      hours_analysis: 0,
      hours_development: 0,
      hours_internal_test: 0,
      hours_uat: 0,
      hours_release: 0,
      hours_pm: 0,
      hours_startup: 0,
      hours_documentation: 0
    });
  }

  const phases = [
    { key: 'hours_analysis', total: totals.hours_analysis, intervals: data.intervals_analysis },
    { key: 'hours_development', total: totals.hours_development, intervals: data.intervals_development },
    { key: 'hours_internal_test', total: totals.hours_internal_test, intervals: data.intervals_internal_test },
    { key: 'hours_uat', total: totals.hours_uat, intervals: data.intervals_uat },
    { key: 'hours_release', total: totals.hours_release, intervals: data.intervals_release },
    { key: 'hours_pm', total: totals.hours_pm, intervals: data.intervals_pm },
    { key: 'hours_startup', total: totals.hours_startup, intervals: data.intervals_startup },
    { key: 'hours_documentation', total: totals.hours_documentation, intervals: data.intervals_documentation }
  ];

  phases.forEach(phase => {
    const hours_per_interval = phase.total / phase.intervals.length;
    phase.intervals.forEach(intervalNum => {
      intervals[intervalNum - 1][phase.key] = hours_per_interval;
    });
  });

  // Raccoglie tutte le chiavi di distribuzione da tutte le fasi
  const phaseKeys = ['analysis', 'development', 'internal_test', 'uat', 'release', 'pm', 'startup', 'documentation'];
  const allCategories = new Set();
  phaseKeys.forEach(pk => {
    if (config[pk]?.distribution) {
      Object.keys(config[pk].distribution).forEach(cat => allCategories.add(cat));
    }
  });
  const distributionCategories = [...allCategories];

  intervals.forEach(interval => {
    const hours_categories = {};
    const fte_categories = {};

    distributionCategories.forEach(category => {
      let categoryHours = 0;
      phaseKeys.forEach(pk => {
        const phaseHoursKey = `hours_${pk}`;
        const pct = config[pk]?.distribution?.[category] || 0;
        categoryHours += (interval[phaseHoursKey] * pct / 100);
      });
      hours_categories[category] = parseFloat(categoryHours.toFixed(2));
      fte_categories[category] = parseFloat((categoryHours / working_hours_per_interval).toFixed(2));
    });

    interval.fte_categories = fte_categories;
    interval.hours_categories = hours_categories;

    // Campi legacy per retrocompatibilita
    interval.hours_funzionale = hours_categories.functional || 0;
    interval.hours_tecnico = hours_categories.technical || 0;
    interval.hours_governance = hours_categories.governance || 0;
    interval.fte_funzionale = fte_categories.functional || 0;
    interval.fte_tecnico = fte_categories.technical || 0;
    interval.fte_governance = fte_categories.governance || 0;

    interval.hours_analysis = parseFloat(interval.hours_analysis.toFixed(2));
    interval.hours_development = parseFloat(interval.hours_development.toFixed(2));
    interval.hours_internal_test = parseFloat(interval.hours_internal_test.toFixed(2));
    interval.hours_uat = parseFloat(interval.hours_uat.toFixed(2));
    interval.hours_release = parseFloat(interval.hours_release.toFixed(2));
    interval.hours_pm = parseFloat(interval.hours_pm.toFixed(2));
    interval.hours_startup = parseFloat(interval.hours_startup.toFixed(2));
    interval.hours_documentation = parseFloat(interval.hours_documentation.toFixed(2));
  });

  const summary = {
    total_hours_funzionale: 0,
    total_hours_tecnico: 0,
    total_hours_governance: 0,
    total_hours_categories: {}
  };

  distributionCategories.forEach(cat => { summary.total_hours_categories[cat] = 0; });

  intervals.forEach(interval => {
    summary.total_hours_funzionale += interval.hours_funzionale;
    summary.total_hours_tecnico += interval.hours_tecnico;
    summary.total_hours_governance += interval.hours_governance;
    distributionCategories.forEach(cat => {
      summary.total_hours_categories[cat] += interval.hours_categories[cat] || 0;
    });
  });

  summary.total_hours_funzionale = parseFloat(summary.total_hours_funzionale.toFixed(2));
  summary.total_hours_tecnico = parseFloat(summary.total_hours_tecnico.toFixed(2));
  summary.total_hours_governance = parseFloat(summary.total_hours_governance.toFixed(2));
  Object.keys(summary.total_hours_categories).forEach(cat => {
    summary.total_hours_categories[cat] = parseFloat(summary.total_hours_categories[cat].toFixed(2));
  });
  summary.total_hours = parseFloat((summary.total_hours_funzionale + summary.total_hours_tecnico + summary.total_hours_governance).toFixed(2));

  return {
    estimate_id: estimateId,
    total_days: data.total_days,
    contingency_percentage: estimate.contingency_percentage,
    distribution_categories: distributionCategories,
    summary,
    intervals
  };
}

export {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  createTask,
  updateTask,
  deleteTask,
  cloneEstimate,
  simpleConvert,
  saveDraftProject,
  getDraftProject,
  convertToProject,
  calculateFTE,
  calculateTotals
};

export default {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  createTask,
  updateTask,
  deleteTask,
  cloneEstimate,
  simpleConvert,
  saveDraftProject,
  getDraftProject,
  convertToProject,
  calculateFTE,
  calculateTotals
};
