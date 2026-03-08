import { isValidUUID } from "../utils/dbValidations.js";
import { validationError } from "../utils/errorHandler.js";

export function validateDateRange(query) {
  const { start_date, end_date } = query;

  if (!start_date || !end_date) {
    throw validationError("TIMESHEET_DATES_REQUIRED", "start_date and end_date are required");
  }

  return { start_date, end_date };
}

export function validateTimesheetInput(data) {
  const { task_id, work_date, hours_worked, details, external_key } = data;

  if (!task_id || !work_date || hours_worked === undefined) {
    throw validationError("TIMESHEET_FIELDS_REQUIRED", "task_id, work_date and hours_worked are required");
  }

  if (!isValidUUID(task_id)) {
    throw validationError("TIMESHEET_INVALID_TASK_ID", "Invalid task_id");
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
    throw validationError("TIMESHEET_INVALID_TIMESHEET_ID", "Invalid timesheet_id");
  }
  return timesheetId;
}

export function validateSnapshotId(snapshotId) {
  if (!snapshotId || !isValidUUID(snapshotId)) {
    throw validationError("TIMESHEET_INVALID_SNAPSHOT_ID", "Invalid snapshot_id");
  }
  return snapshotId;
}

export function validateSubmitTimesheetsInput(data) {
  const { timesheet_ids } = data;

  if (!timesheet_ids || !Array.isArray(timesheet_ids) || timesheet_ids.length === 0) {
    throw validationError("TIMESHEET_IDS_REQUIRED", "timesheet_ids must be a non-empty array");
  }

  for (const id of timesheet_ids) {
    if (!isValidUUID(id)) {
      throw validationError("TIMESHEET_INVALID_ID_IN_ARRAY", `Invalid timesheet_id: ${id}`);
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
