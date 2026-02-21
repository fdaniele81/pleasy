import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateCreateTask(data) {
  const { project_id, title } = data;

  if (!project_id || !title) {
    throw validationError("Progetto e titolo sono obbligatori");
  }

  if (!isValidUUID(project_id)) {
    throw validationError("project_id non valido");
  }

  if (data.start_date && isNaN(Date.parse(data.start_date))) {
    throw validationError(`Data di inizio non valida: ${data.start_date}`);
  }
  if (data.end_date && isNaN(Date.parse(data.end_date))) {
    throw validationError(`Data di fine non valida: ${data.end_date}`);
  }
  const status = data.task_status_id || "TODO";
  if (status === "IN PROGRESS") {
    if (!data.start_date || !data.end_date) {
      throw validationError("Le date di inizio e fine sono obbligatorie quando si crea un task in IN PROGRESS");
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
    throw validationError("task_id non valido");
  }
  return taskId;
}

export function validateProjectId(projectId) {
  if (!projectId || !isValidUUID(projectId)) {
    throw validationError("project_id non valido");
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
    owner_id: normalize(data.owner_id) ?? existingTask.owner_id,
    budget: data.budget ?? existingTask.budget,
    start_date: normalize(data.start_date) ?? existingTask.start_date,
    end_date: normalize(data.end_date) ?? existingTask.end_date,
    external_key: data.external_key !== undefined ? normalize(data.external_key) : existingTask.external_key
  };

  if (final.start_date && isNaN(Date.parse(final.start_date))) {
    throw validationError(`Data di inizio non valida: ${final.start_date}`);
  }
  if (final.end_date && isNaN(Date.parse(final.end_date))) {
    throw validationError(`Data di fine non valida: ${final.end_date}`);
  }
  if (final.task_status_id === "IN PROGRESS") {
    if (!final.start_date || !final.end_date) {
      throw validationError("Le date di inizio e fine sono obbligatorie quando il task è IN PROGRESS");
    }
  }

  return final;
}

export function validateInitialActual(data) {
  const { initial_actual } = data;

  if (initial_actual === undefined || initial_actual === null) {
    throw validationError("Il campo initial_actual è obbligatorio");
  }

  if (initial_actual < 0) {
    throw validationError("Il valore di initial_actual non può essere negativo");
  }

  return { initial_actual };
}

export function validateFTEReportParams(query) {
  const { data_inizio, data_fine, data_riferimento_etc } = query;

  if (!data_inizio || !data_fine) {
    throw validationError("I parametri data_inizio e data_fine sono obbligatori");
  }

  const startDate = new Date(data_inizio);
  const endDate = new Date(data_fine);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw validationError("Date non valide");
  }

  if (endDate <= startDate) {
    throw validationError("La data_fine deve essere successiva alla data_inizio");
  }

  const diffTime = endDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays % 14 !== 0) {
    throw validationError(`La differenza tra data_fine e data_inizio deve essere un multiplo di 14 giorni. Differenza attuale: ${diffDays} giorni`);
  }

  let etcReferenceDate = null;
  if (data_riferimento_etc) {
    etcReferenceDate = new Date(data_riferimento_etc);
    if (isNaN(etcReferenceDate.getTime())) {
      throw validationError("data_riferimento_etc non valida");
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
