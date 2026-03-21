import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateCreateTask(data) {
  const { project_id, title } = data;

  if (!project_id || !title) {
    throw validationError("TASK_PROJECT_TITLE_REQUIRED", "Project and title are required");
  }

  if (!isValidUUID(project_id)) {
    throw validationError("ESTIMATE_INVALID_PROJECT_ID", "Invalid project_id");
  }

  if (data.start_date && isNaN(Date.parse(data.start_date))) {
    throw validationError("TASK_INVALID_START_DATE", `Invalid start date: ${data.start_date}`);
  }
  if (data.end_date && isNaN(Date.parse(data.end_date))) {
    throw validationError("TASK_INVALID_END_DATE", `Invalid end date: ${data.end_date}`);
  }
  const status = data.task_status_id || "TODO";
  if (status === "IN PROGRESS") {
    if (!data.start_date || !data.end_date) {
      throw validationError("TASK_DATES_REQUIRED_IN_PROGRESS", "Start and end dates are required for IN PROGRESS tasks");
    }
  }

  const normalizedOwnerId = data.owner_id && typeof data.owner_id === 'string' && data.owner_id.trim() !== ''
    ? data.owner_id.trim()
    : null;

  return {
    project_id,
    title: title.trim(),
    description: data.description?.trim() || null,
    task_details: data.details || null,
    task_status_id: status,
    owner_id: normalizedOwnerId,
    budget: data.budget || 0,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    external_key: data.external_key || null
  };
}

export function validateTaskId(taskId) {
  if (!taskId || !isValidUUID(taskId)) {
    throw validationError("TIMESHEET_INVALID_TASK_ID", "Invalid task_id");
  }
  return taskId;
}

export function validateProjectId(projectId) {
  if (!projectId || !isValidUUID(projectId)) {
    throw validationError("ESTIMATE_INVALID_PROJECT_ID", "Invalid project_id");
  }
  return projectId;
}

export function normalize(val) {
  if (val === undefined) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  if (typeof val === 'string') return val.trim();
  return val;
}

export function validateUpdateTask(data, existingTask) {
  const final = {
    title: data.title ?? existingTask.title,
    description: normalize(data.description) ?? existingTask.description,
    task_details: data.details !== undefined ? (data.details || null) : existingTask.task_details,
    task_status_id: data.task_status_id ?? existingTask.task_status_id,
    owner_id: data.owner_id !== undefined ? normalize(data.owner_id) : existingTask.owner_id,
    budget: data.budget ?? existingTask.budget,
    start_date: normalize(data.start_date) ?? existingTask.start_date,
    end_date: normalize(data.end_date) ?? existingTask.end_date,
    external_key: data.external_key !== undefined ? normalize(data.external_key) : existingTask.external_key
  };

  if (final.start_date && isNaN(Date.parse(final.start_date))) {
    throw validationError("TASK_INVALID_START_DATE", `Invalid start date: ${final.start_date}`);
  }
  if (final.end_date && isNaN(Date.parse(final.end_date))) {
    throw validationError("TASK_INVALID_END_DATE", `Invalid end date: ${final.end_date}`);
  }
  if (final.task_status_id === "IN PROGRESS") {
    if (!final.start_date || !final.end_date) {
      throw validationError("TASK_DATES_REQUIRED_IN_PROGRESS", "Start and end dates are required for IN PROGRESS tasks");
    }
  }

  return final;
}

export function validateInitialActual(data) {
  const { initial_actual } = data;

  if (initial_actual === undefined || initial_actual === null) {
    throw validationError("TASK_INITIAL_ACTUAL_REQUIRED", "The initial_actual field is required");
  }

  if (initial_actual < 0) {
    throw validationError("TASK_INITIAL_ACTUAL_NEGATIVE", "initial_actual cannot be negative");
  }

  return { initial_actual };
}

export function validateFTEReportParams(query) {
  const { data_inizio, data_fine, data_riferimento_etc } = query;

  if (!data_inizio || !data_fine) {
    throw validationError("TASK_DATE_RANGE_REQUIRED", "Start date and end date parameters are required");
  }

  const startDate = new Date(data_inizio);
  const endDate = new Date(data_fine);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw validationError("TASK_INVALID_DATES", "Invalid dates");
  }

  if (endDate <= startDate) {
    throw validationError("TASK_END_BEFORE_START", "End date must be after start date");
  }

  const diffTime = endDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays % 14 !== 0) {
    throw validationError("TASK_BIWEEKLY_RANGE", `Date range must be a multiple of 14 days. Current difference: ${diffDays} days`);
  }

  let etcReferenceDate = null;
  if (data_riferimento_etc) {
    etcReferenceDate = new Date(data_riferimento_etc);
    if (isNaN(etcReferenceDate.getTime())) {
      throw validationError("TASK_INVALID_ETC_DATE", "data_riferimento_etc non valida");
    }
    etcReferenceDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate, diffDays, etcReferenceDate };
}

export { validationError };

export default {
  validateCreateTask,
  validateTaskId,
  validateProjectId,
  normalize,
  validateUpdateTask,
  validateInitialActual,
  validateFTEReportParams,
  validationError
};
