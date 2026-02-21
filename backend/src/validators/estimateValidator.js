import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateCreateEstimate(data) {
  const { client_id, title } = data;

  if (!client_id || !title) {
    throw validationError("client_id e title sono obbligatori");
  }

  if (!isValidUUID(client_id)) {
    throw validationError("client_id non valido");
  }

  if (data.project_id && !isValidUUID(data.project_id)) {
    throw validationError("project_id non valido");
  }

  if (data.project_managers !== undefined) {
    if (!Array.isArray(data.project_managers)) {
      throw validationError("project_managers deve essere un array");
    }
    for (const pmId of data.project_managers) {
      if (!isValidUUID(pmId)) {
        throw validationError(`Project Manager ID non valido: ${pmId}`);
      }
    }
  }

  return {
    client_id,
    title: title.trim(),
    description: data.description?.trim() || null,
    project_id: data.project_id || null,
    pct_analysis: data.pct_analysis,
    pct_development: data.pct_development,
    pct_internal_test: data.pct_internal_test,
    pct_uat: data.pct_uat,
    pct_release: data.pct_release,
    pct_pm: data.pct_pm,
    pct_startup: data.pct_startup,
    pct_documentation: data.pct_documentation,
    contingency_percentage: data.contingency_percentage,
    project_managers: data.project_managers
  };
}

export function validateEstimateId(estimateId) {
  if (!isValidUUID(estimateId)) {
    throw validationError("estimate_id non valido");
  }
  return estimateId;
}

export function validateUpdateEstimate(data) {
  const validated = {};

  if (data.title !== undefined) {
    validated.title = data.title.trim();
  }
  if (data.description !== undefined) {
    validated.description = data.description?.trim() || null;
  }
  if (data.project_id !== undefined) {
    if (data.project_id !== null && !isValidUUID(data.project_id)) {
      throw validationError("project_id non valido");
    }
    validated.project_id = data.project_id;
  }

  const percentageFields = [
    'pct_analysis', 'pct_development', 'pct_internal_test', 'pct_uat',
    'pct_release', 'pct_pm', 'pct_startup', 'pct_documentation',
    'contingency_percentage'
  ];

  for (const field of percentageFields) {
    if (data[field] !== undefined) {
      validated[field] = data[field];
    }
  }

  if (data.status !== undefined) {
    const allowedStatuses = ['DRAFT', 'CONVERTED'];
    if (!allowedStatuses.includes(data.status)) {
      throw validationError("Stato non valido. Valori ammessi: DRAFT, CONVERTED");
    }
    validated.status = data.status;
  }

  if (data.estimate_phase_config !== undefined) {
    if (data.estimate_phase_config !== null && typeof data.estimate_phase_config !== 'object') {
      throw validationError("estimate_phase_config deve essere un oggetto JSON valido");
    }
    validated.estimate_phase_config = data.estimate_phase_config;
  }

  if (data.project_managers !== undefined) {
    if (!Array.isArray(data.project_managers)) {
      throw validationError("project_managers deve essere un array");
    }
    for (const pmId of data.project_managers) {
      if (!isValidUUID(pmId)) {
        throw validationError(`Project Manager ID non valido: ${pmId}`);
      }
    }
    validated.project_managers = data.project_managers;
  }

  if (Object.keys(validated).length === 0) {
    throw validationError("Nessun campo da aggiornare");
  }

  return validated;
}

export function validateCreateTask(data) {
  const { activity_name, hours_development_input } = data;

  if (!activity_name || hours_development_input === undefined) {
    throw validationError("activity_name e hours_development_input sono obbligatori");
  }

  if (hours_development_input < 0) {
    throw validationError("hours_development_input deve essere maggiore o uguale a 0");
  }

  return {
    activity_name: activity_name.trim(),
    activity_detail: data.activity_detail?.trim() || null,
    hours_development_input
  };
}

export function validateTaskIds(estimateId, taskId) {
  if (!isValidUUID(estimateId) || !isValidUUID(taskId)) {
    throw validationError("ID non validi");
  }
  return { estimateId, taskId };
}

export function validateUpdateTask(data) {
  const validated = {};

  if (data.activity_name !== undefined) {
    validated.activity_name = data.activity_name.trim();
  }
  if (data.activity_detail !== undefined) {
    validated.activity_detail = data.activity_detail?.trim() || null;
  }
  if (data.hours_development_input !== undefined) {
    if (data.hours_development_input < 0) {
      throw validationError("hours_development_input deve essere maggiore o uguale a 0");
    }
    validated.hours_development_input = data.hours_development_input;
  }

  const hoursFields = [
    'hours_analysis', 'hours_development', 'hours_internal_test',
    'hours_uat', 'hours_release', 'hours_pm', 'hours_startup',
    'hours_documentation', 'hours_contingency'
  ];

  for (const field of hoursFields) {
    if (data[field] !== undefined) {
      validated[field] = data[field];
    }
  }

  if (Object.keys(validated).length === 0) {
    throw validationError("Nessun campo da aggiornare");
  }

  return validated;
}

export function validateConvertToProject(data) {
  const { project_key, project_title, project_managers, tasks } = data;

  if (!project_key || !project_title || !project_managers?.length || !tasks?.length) {
    throw validationError("project_key, project_title, project_managers (array) e tasks (array) sono obbligatori");
  }

  for (const pmId of project_managers) {
    if (!isValidUUID(pmId)) {
      throw validationError(`Project Manager ID non valido: ${pmId}`);
    }
  }

  for (const task of tasks) {
    if (!task.title || task.budget === undefined || task.budget < 0) {
      throw validationError("Ogni task deve avere title e budget validi");
    }
  }

  return {
    project_key: project_key.toUpperCase(),
    project_title: project_title.trim(),
    project_managers,
    tasks: tasks.map(t => ({
      title: t.title.trim(),
      description: t.description?.trim() || '',
      budget: t.budget
    }))
  };
}

export function validateSaveDraftProject(data) {
  const { project_key, project_title, project_managers } = data;

  if (!project_key || !project_title || !project_managers?.length) {
    throw validationError("project_key, project_title e project_managers (array) sono obbligatori");
  }

  return {
    project_key: project_key.toUpperCase(),
    project_title: project_title.trim(),
    project_managers,
    tasks: data.tasks?.map(t => ({
      title: t.title?.trim(),
      description: t.description?.trim() || '',
      budget: t.budget || 0
    })) || []
  };
}

export function validateCloneEstimate(data) {
  const { title, project_key } = data;

  if (!title || !title.trim()) {
    throw validationError("Il titolo è obbligatorio");
  }

  return {
    title: title.trim(),
    project_key: project_key?.trim()?.toUpperCase() || null
  };
}

export function validateSimpleConvert(data) {
  const { project_id } = data;

  if (!project_id || !isValidUUID(project_id)) {
    throw validationError("project_id valido è obbligatorio");
  }

  return { project_id };
}

export function validateCalculateFTE(data) {
  const {
    total_days,
    intervals_analysis,
    intervals_development,
    intervals_internal_test,
    intervals_uat,
    intervals_release,
    intervals_pm,
    intervals_startup,
    intervals_documentation
  } = data;

  if (!total_days || total_days <= 0 || total_days % 10 !== 0) {
    throw validationError("total_days è obbligatorio e deve essere un multiplo di 10");
  }

  const validateIntervals = (intervals, name) => {
    if (!intervals || !Array.isArray(intervals)) {
      throw validationError(`${name} deve essere un array`);
    }
    if (intervals.length === 0) {
      throw validationError(`${name} non può essere vuoto`);
    }
    for (const interval of intervals) {
      if (!Number.isInteger(interval) || interval < 1 || interval > 10) {
        throw validationError(`${name} deve contenere numeri interi tra 1 e 10`);
      }
    }
  };

  validateIntervals(intervals_analysis, 'intervals_analysis');
  validateIntervals(intervals_development, 'intervals_development');
  validateIntervals(intervals_internal_test, 'intervals_internal_test');
  validateIntervals(intervals_uat, 'intervals_uat');
  validateIntervals(intervals_release, 'intervals_release');
  validateIntervals(intervals_pm, 'intervals_pm');
  validateIntervals(intervals_startup, 'intervals_startup');
  validateIntervals(intervals_documentation, 'intervals_documentation');

  return {
    total_days,
    intervals_analysis,
    intervals_development,
    intervals_internal_test,
    intervals_uat,
    intervals_release,
    intervals_pm,
    intervals_startup,
    intervals_documentation
  };
}

export function validateClientIdParam(clientId) {
  if (clientId && !isValidUUID(clientId)) {
    throw validationError("client_id non valido");
  }
  return clientId;
}

export function validateProjectIdParam(projectId) {
  if (projectId && !isValidUUID(projectId)) {
    throw validationError("project_id non valido");
  }
  return projectId;
}

export { validationError };

export default {
  validateCreateEstimate,
  validateEstimateId,
  validateUpdateEstimate,
  validateCreateTask,
  validateTaskIds,
  validateUpdateTask,
  validateConvertToProject,
  validateSaveDraftProject,
  validateCloneEstimate,
  validateSimpleConvert,
  validateCalculateFTE,
  validateClientIdParam,
  validateProjectIdParam,
  validationError
};
