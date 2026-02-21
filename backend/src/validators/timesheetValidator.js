import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateDateRange(query) {
  const { start_date, end_date } = query;

  if (!start_date || !end_date) {
    throw validationError("start_date e end_date sono obbligatori");
  }

  return { start_date, end_date };
}

export function validateTimesheetInput(data) {
  const { task_id, work_date, hours_worked, details, external_key } = data;

  if (!task_id || !work_date || hours_worked === undefined) {
    throw validationError("task_id, work_date e hours_worked sono obbligatori");
  }

  if (!isValidUUID(task_id)) {
    throw validationError("task_id non valido");
  }

  return {
    task_id,
    work_date,
    hours_worked,
    details: details || null,
    external_key: external_key || null
  };
}

export function validateTimesheetId(timesheetId) {
  if (!timesheetId || !isValidUUID(timesheetId)) {
    throw validationError("timesheet_id non valido");
  }
  return timesheetId;
}

export function validateSnapshotId(snapshotId) {
  if (!snapshotId || !isValidUUID(snapshotId)) {
    throw validationError("snapshot_id non valido");
  }
  return snapshotId;
}

export function validateSubmitTimesheetsInput(data) {
  const { timesheet_ids } = data;

  if (!timesheet_ids || !Array.isArray(timesheet_ids) || timesheet_ids.length === 0) {
    throw validationError("timesheet_ids deve essere un array non vuoto");
  }

  for (const id of timesheet_ids) {
    if (!isValidUUID(id)) {
      throw validationError(`timesheet_id non valido: ${id}`);
    }
  }

  return { timesheet_ids };
}

export { validationError };

export default {
  validateDateRange,
  validateTimesheetInput,
  validateTimesheetId,
  validateSnapshotId,
  validateSubmitTimesheetsInput,
  validationError
};
