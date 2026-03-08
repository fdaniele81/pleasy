import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateCreateEstimate(data) {
  const { client_id, title } = data;

  if (!client_id || !title) {
    throw validationError("ESTIMATE_CLIENT_TITLE_REQUIRED", "client_id and title are required");
  }

  if (!isValidUUID(client_id)) {
    throw validationError("ESTIMATE_INVALID_CLIENT_ID", "Invalid client_id");
  }

  if (data.project_id && !isValidUUID(data.project_id)) {
    throw validationError("ESTIMATE_INVALID_PROJECT_ID", "Invalid project_id");
  }

  if (data.project_managers !== undefined) {
    if (!Array.isArray(data.project_managers)) {
      throw validationError("ESTIMATE_PM_MUST_BE_ARRAY", "project_managers must be an array");
    }
    for (const pmId of data.project_managers) {
      if (!isValidUUID(pmId)) {
        throw validationError("ESTIMATE_INVALID_PM_ID", `Invalid Project Manager ID: ${pmId}`);
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
    throw validationError("ESTIMATE_INVALID_ESTIMATE_ID", "Invalid estimate_id");
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
      throw validationError("ESTIMATE_INVALID_PROJECT_ID", "Invalid project_id");
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
      throw validationError("ESTIMATE_INVALID_STATUS", "Invalid status. Allowed values: DRAFT, CONVERTED");
    }
    validated.status = data.status;
  }

  if (data.estimate_phase_config !== undefined) {
    if (data.estimate_phase_config !== null && typeof data.estimate_phase_config !== 'object') {
      throw validationError("ESTIMATE_INVALID_PHASE_CONFIG", "estimate_phase_config must be a valid JSON object");
    }
    validated.estimate_phase_config = data.estimate_phase_config;
  }

  if (data.project_managers !== undefined) {
    if (!Array.isArray(data.project_managers)) {
      throw validationError("ESTIMATE_PM_MUST_BE_ARRAY", "project_managers must be an array");
    }
    for (const pmId of data.project_managers) {
      if (!isValidUUID(pmId)) {
        throw validationError("ESTIMATE_INVALID_PM_ID", `Invalid Project Manager ID: ${pmId}`);
      }
    }
    validated.project_managers = data.project_managers;
  }

  if (Object.keys(validated).length === 0) {
    throw validationError("ESTIMATE_NO_FIELDS", "No fields to update");
  }

  return validated;
}

export function validateCreateTask(data) {
  const { activity_name, hours_development_input } = data;

  if (!activity_name || hours_development_input === undefined) {
    throw validationError("ESTIMATE_ACTIVITY_REQUIRED", "activity_name and hours_development_input are required");
  }

  if (hours_development_input < 0) {
    throw validationError("ESTIMATE_HOURS_NEGATIVE", "hours_development_input must be greater than or equal to 0");
  }

  return {
    activity_name: activity_name.trim(),
    activity_detail: data.activity_detail?.trim() || null,
    hours_development_input
  };
}

export function validateTaskIds(estimateId, taskId) {
  if (!isValidUUID(estimateId) || !isValidUUID(taskId)) {
    throw validationError("ESTIMATE_INVALID_IDS", "Invalid IDs");
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
      throw validationError("ESTIMATE_HOURS_NEGATIVE", "hours_development_input must be greater than or equal to 0");
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
    throw validationError("ESTIMATE_NO_FIELDS", "No fields to update");
  }

  return validated;
}

export function validateConvertToProject(data) {
  const { project_key, project_title, project_managers, tasks } = data;

  if (!project_key || !project_title || !project_managers?.length || !tasks?.length) {
    throw validationError("ESTIMATE_CONVERT_REQUIRED", "project_key, project_title, project_managers and tasks are required");
  }

  for (const pmId of project_managers) {
    if (!isValidUUID(pmId)) {
      throw validationError("ESTIMATE_INVALID_PM_ID", `Invalid Project Manager ID: ${pmId}`);
    }
  }

  for (const task of tasks) {
    if (!task.title || task.budget === undefined || task.budget < 0) {
      throw validationError("ESTIMATE_INVALID_TASK", "Each task must have a valid title and budget");
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
    throw validationError("ESTIMATE_DRAFT_REQUIRED", "project_key, project_title and project_managers are required");
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
    throw validationError("ESTIMATE_TITLE_REQUIRED", "Title is required");
  }

  return {
    title: title.trim(),
    project_key: project_key?.trim()?.toUpperCase() || null
  };
}

export function validateSimpleConvert(data) {
  const { project_id } = data;

  if (!project_id || !isValidUUID(project_id)) {
    throw validationError("ESTIMATE_PROJECT_ID_REQUIRED", "Valid project_id is required");
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
    throw validationError("ESTIMATE_TOTAL_DAYS_REQUIRED", "total_days is required and must be a multiple of 10");
  }

  const validateIntervals = (intervals, name) => {
    if (!intervals || !Array.isArray(intervals)) {
      throw validationError("ESTIMATE_MUST_BE_ARRAY", `${name} must be an array`);
    }
    if (intervals.length === 0) {
      throw validationError("ESTIMATE_ARRAY_EMPTY", `${name} cannot be empty`);
    }
    for (const interval of intervals) {
      if (!Number.isInteger(interval) || interval < 1 || interval > 10) {
        throw validationError("ESTIMATE_ARRAY_VALUES", `${name} must contain integers between 1 and 10`);
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
    throw validationError("ESTIMATE_INVALID_CLIENT_ID", "Invalid client_id");
  }
  return clientId;
}

export function validateProjectIdParam(projectId) {
  if (projectId && !isValidUUID(projectId)) {
    throw validationError("ESTIMATE_INVALID_PROJECT_ID", "Invalid project_id");
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
