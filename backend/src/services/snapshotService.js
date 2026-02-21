import timesheetRepository from "../repositories/timesheetRepository.js";
import { serviceError } from "../utils/errorHandler.js";

async function getSnapshots(startDate, endDate, user) {
  let rows;

  if (user.role_id === "PM") {
    rows = await timesheetRepository.getSnapshotsForPM(user.company_id, startDate, endDate);
  } else {
    rows = await timesheetRepository.getSnapshotsForUser(user.user_id, startDate, endDate);
  }

  return rows.map(row => ({
    snapshot_id: row.snapshot_id,
    user_id: row.user_id,
    user_name: row.full_name || row.email,
    email: row.email,
    company_id: row.company_id,
    company_name: row.legal_name,
    is_submitted: row.is_submitted,
    submitted_at: row.submitted_at,
    min_date: row.min_date,
    max_date: row.max_date,
    timesheet_count: parseInt(row.timesheet_count) || 0,
    total_hours: parseFloat(row.total_hours) || 0
  }));
}

async function getSnapshotDetails(snapshotId, user) {
  const snapshot = await timesheetRepository.findSnapshotById(snapshotId);

  if (!snapshot) {
    throw serviceError("Snapshot non trovato", 404);
  }

  if (user.role_id === "USER" && snapshot.user_id !== user.user_id) {
    throw serviceError("Non sei autorizzato a visualizzare questo snapshot", 403);
  }

  if (user.role_id === "PM" && snapshot.company_id !== user.company_id) {
    throw serviceError("Non sei autorizzato a visualizzare questo snapshot", 403);
  }

  const rows = await timesheetRepository.getSnapshotDetails(snapshotId);

  const today = new Date().toISOString().split('T')[0];

  const tasksMap = new Map();

  let tm_hours_before_today = 0;
  let tm_hours_from_today = 0;

  rows.forEach(row => {
    const taskKey = row.task_id;
    const isTM = row.project_type_id === 'TM';

    if (!tasksMap.has(taskKey)) {
      tasksMap.set(taskKey, {
        task_id: row.task_id,
        task_number: row.task_number,
        task_title: row.task_title,
        task_description: row.task_description,
        project_id: row.project_id,
        project_key: row.project_key,
        project_title: row.project_title,
        project_type_id: row.project_type_id,
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_color: row.client_color,
        timesheets: [],
        total_hours: 0
      });
    }

    const task = tasksMap.get(taskKey);
    const hours = parseFloat(row.total_hours);

    task.timesheets.push({
      timesheet_id: row.timesheet_id,
      timesheet_date: row.timesheet_date,
      hours: hours,
      details: row.details
    });
    task.total_hours += hours;

    if (isTM) {
      if (row.timesheet_date < today) {
        tm_hours_before_today += hours;
      } else {
        tm_hours_from_today += hours;
      }
    }
  });

  return {
    snapshot: {
      snapshot_id: snapshot.snapshot_id,
      submitted_at: snapshot.submitted_at,
      is_submitted: snapshot.is_submitted
    },
    tasks: Array.from(tasksMap.values()),
    tm_hours_before_today,
    tm_hours_from_today
  };
}

async function reopenSnapshot(snapshotId, user) {
  const pool = timesheetRepository.getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const snapshot = await timesheetRepository.findSnapshotById(snapshotId, client);

    if (!snapshot) {
      await client.query('ROLLBACK');
      throw serviceError("Snapshot non trovato", 404);
    }

    if (!snapshot.is_submitted) {
      await client.query('ROLLBACK');
      throw serviceError("Lo snapshot non è stato sottomesso", 400);
    }

    if (user.role_id === "USER" && snapshot.user_id !== user.user_id) {
      await client.query('ROLLBACK');
      throw serviceError("Non sei autorizzato a riaprire questo snapshot", 403);
    }

    if (user.role_id === "PM" && snapshot.company_id !== user.company_id) {
      await client.query('ROLLBACK');
      throw serviceError("Non sei autorizzato a riaprire questo snapshot", 403);
    }

    const timesheetsToReopen = await timesheetRepository.getTimesheetsToReopen(snapshotId, client);

    for (const row of timesheetsToReopen) {
      const taskId = row.task_id;
      const hoursToRestore = parseFloat(row.total_hours);

      const etc = await timesheetRepository.getTaskETC(taskId, client);
      if (etc) {
        const currentEtc = parseFloat(etc.etc_hours);
        const newEtc = currentEtc + hoursToRestore;
        await timesheetRepository.updateTaskETC(taskId, newEtc, client);
      }
    }

    const reopenedTimesheets = await timesheetRepository.reopenTimesheets(snapshotId, client);

    await timesheetRepository.updateSnapshotStatus(snapshotId, false, client);

    await client.query('COMMIT');

    return {
      snapshot_id: snapshotId,
      timesheets_reopened: reopenedTimesheets.length
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export {
  getSnapshots,
  getSnapshotDetails,
  reopenSnapshot
};

export default {
  getSnapshots,
  getSnapshotDetails,
  reopenSnapshot
};
