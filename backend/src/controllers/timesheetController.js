import timesheetService from "../services/timesheetService.js";
import timesheetValidator from "../validators/timesheetValidator.js";
import { handleError } from "../utils/errorHandler.js";

async function getTimesheets(req, res) {
  try {
    const { start_date, end_date } = timesheetValidator.validateDateRange(req.query);
    const result = await timesheetService.getTimesheets(start_date, end_date, req.user);

    res.status(200).json({
      message: "Timesheet recuperati correttamente",
      projects: result.projects
    });
  } catch (err) {
    handleError(res, err, "GET TIMESHEET ERR");
  }
}

async function saveTimesheet(req, res) {
  try {
    const data = timesheetValidator.validateTimesheetInput(req.body);
    const timesheet = await timesheetService.saveTimesheet(data, req.user);

    res.status(200).json({
      message: "Timesheet salvato correttamente",
      timesheet
    });
  } catch (err) {
    handleError(res, err, "SAVE TIMESHEET ERR");
  }
}

async function deleteTimesheet(req, res) {
  try {
    const timesheetId = timesheetValidator.validateTimesheetId(req.params.timesheet_id);
    const deletedId = await timesheetService.deleteTimesheet(timesheetId, req.user);

    res.status(200).json({
      message: "Timesheet eliminato correttamente",
      timesheet_id: deletedId
    });
  } catch (err) {
    handleError(res, err, "DELETE TIMESHEET ERR");
  }
}

async function submitTimesheets(req, res) {
  try {
    const { timesheet_ids } = timesheetValidator.validateSubmitTimesheetsInput(req.body);
    const result = await timesheetService.submitTimesheets(timesheet_ids, req.user);

    if (result.count === 0) {
      return res.status(200).json({
        message: 'Nessun timesheet da sottomettere',
        count: 0
      });
    }

    res.status(200).json({
      message: `${result.count} timesheet sottomessi correttamente`,
      count: result.count,
      snapshot_id: result.snapshot_id
    });
  } catch (err) {
    handleError(res, err, "SUBMIT TIMESHEETS ERR");
  }
}

async function getMaxSubmittedDate(req, res) {
  try {
    const maxDate = await timesheetService.getMaxSubmittedDate(req.user);

    res.status(200).json({
      max_submitted_date: maxDate
    });
  } catch (err) {
    handleError(res, err, "GET MAX SUBMITTED DATE ERR");
  }
}

async function getDatesWithTimesheets(req, res) {
  try {
    const { start_date, end_date } = timesheetValidator.validateDateRange(req.query);
    const dates = await timesheetService.getDatesWithTimesheets(start_date, end_date, req.user);

    res.status(200).json({
      dates
    });
  } catch (err) {
    handleError(res, err, "GET DATES WITH TIMESHEETS ERR");
  }
}

async function getSnapshots(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const snapshots = await timesheetService.getSnapshots(start_date, end_date, req.user);

    res.status(200).json({
      message: "Snapshot recuperati correttamente",
      snapshots
    });
  } catch (err) {
    handleError(res, err, "GET SNAPSHOTS ERR");
  }
}

async function getSnapshotDetails(req, res) {
  try {
    const snapshotId = timesheetValidator.validateSnapshotId(req.params.snapshot_id);
    const result = await timesheetService.getSnapshotDetails(snapshotId, req.user);

    res.status(200).json({
      message: "Dettagli snapshot recuperati correttamente",
      ...result
    });
  } catch (err) {
    handleError(res, err, "GET SNAPSHOT DETAILS ERR");
  }
}

async function getPreviewSubmission(req, res) {
  try {
    const tasks = await timesheetService.getPreviewSubmission(req.user);

    if (tasks.length === 0) {
      return res.status(200).json({
        message: "Nessun consuntivo da sottomettere",
        tasks: []
      });
    }

    res.status(200).json({
      message: "Anteprima sottomissione recuperata correttamente",
      tasks
    });
  } catch (err) {
    handleError(res, err, "GET PREVIEW SUBMISSION ERR");
  }
}

async function reopenSnapshot(req, res) {
  try {
    const snapshotId = timesheetValidator.validateSnapshotId(req.params.snapshot_id);
    const result = await timesheetService.reopenSnapshot(snapshotId, req.user);

    res.status(200).json({
      message: `Snapshot riaperto correttamente. ${result.timesheets_reopened} timesheet sono ora modificabili`,
      snapshot_id: result.snapshot_id,
      timesheets_reopened: result.timesheets_reopened
    });
  } catch (err) {
    handleError(res, err, "REOPEN SNAPSHOT ERR");
  }
}

async function getTMPlanning(req, res) {
  try {
    const { start_date, end_date } = timesheetValidator.validateDateRange(req.query);
    const data = await timesheetService.getTMPlanning(start_date, end_date, req.user);

    res.status(200).json({
      message: "Dati T&M Planning recuperati correttamente",
      ...data
    });
  } catch (err) {
    handleError(res, err, "GET TM PLANNING ERR");
  }
}

async function saveTimesheetForPM(req, res) {
  try {
    const data = timesheetValidator.validateTimesheetInput(req.body);
    const timesheet = await timesheetService.saveTimesheetForPM(data, req.user);

    res.status(200).json({
      message: "Timesheet salvato correttamente",
      timesheet
    });
  } catch (err) {
    handleError(res, err, "SAVE TIMESHEET FOR PM ERR");
  }
}

export {
  getTimesheets,
  saveTimesheet,
  deleteTimesheet,
  submitTimesheets,
  getMaxSubmittedDate,
  getDatesWithTimesheets,
  getSnapshots,
  getSnapshotDetails,
  getPreviewSubmission,
  reopenSnapshot,
  getTMPlanning,
  saveTimesheetForPM
};

export default {
  getTimesheets,
  saveTimesheet,
  deleteTimesheet,
  submitTimesheets,
  getMaxSubmittedDate,
  getDatesWithTimesheets,
  getSnapshots,
  getSnapshotDetails,
  getPreviewSubmission,
  reopenSnapshot,
  getTMPlanning,
  saveTimesheetForPM
};
