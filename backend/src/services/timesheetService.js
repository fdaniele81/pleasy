import timesheetRepository from "../repositories/timesheetRepository.js";
import { serviceError } from "../utils/errorHandler.js";
import { getSnapshots, getSnapshotDetails, reopenSnapshot } from "./snapshotService.js";

async function getTimesheets(startDate, endDate, user) {
  const userId = user.user_id;

  const [rows, tmHoursTotals] = await Promise.all([
    timesheetRepository.getTimesheets(userId, startDate, endDate),
    timesheetRepository.getTMTasksHoursTotals(userId)
  ]);

  const tmHoursMap = new Map();
  tmHoursTotals.forEach(row => {
    tmHoursMap.set(row.task_id, {
      hours_before_today: parseFloat(row.hours_before_today) || 0,
      hours_from_today: parseFloat(row.hours_from_today) || 0
    });
  });

  const projectsMap = new Map();

  rows.forEach(row => {
    const projectKey = `${row.client_name}_${row.project_key}`;
    const isTM = row.project_type_id === 'TM';

    if (!projectsMap.has(projectKey)) {
      projectsMap.set(projectKey, {
        project_id: row.project_id,
        project_key: row.project_key,
        project_title: row.project_title,
        project_type_id: row.project_type_id,
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_color: row.client_color,
        tasks: new Map()
      });
    }

    const project = projectsMap.get(projectKey);

    if (!project.tasks.has(row.task_id)) {
      const taskData = {
        task_id: row.task_id,
        task_number: row.task_number,
        task_title: row.task_title,
        task_description: row.task_description,
        budget: parseFloat(row.budget) || 0,
        initial_actual: parseFloat(row.initial_actual) || 0,
        end_date: row.end_date,
        total_hours_worked: parseFloat(row.task_total_hours) || 0,
        etc_hours: parseFloat(row.etc_hours) || 0,
        user_non_submitted_hours: parseFloat(row.user_non_submitted_hours) || 0,
        timesheets: []
      };

      if (isTM) {
        const tmHours = tmHoursMap.get(row.task_id) || { hours_before_today: 0, hours_from_today: 0 };
        taskData.tm_hours_before_today = tmHours.hours_before_today;
        taskData.tm_hours_from_today = tmHours.hours_from_today;
      }

      project.tasks.set(row.task_id, taskData);
    }

    if (row.timesheet_id) {
      const hours = parseFloat(row.total_hours);
      const task = project.tasks.get(row.task_id);

      task.timesheets.push({
        timesheet_id: row.timesheet_id,
        work_date: row.timesheet_date,
        hours_worked: hours,
        details: row.details,
        is_submitted: row.is_submitted
      });
    }
  });

  const projects = Array.from(projectsMap.values()).map(project => ({
    ...project,
    tasks: Array.from(project.tasks.values())
  }));

  const closedActivitiesTotalHours = await timesheetRepository.getClosedActivitiesTotal(userId);
  const closedActivitiesRows = await timesheetRepository.getClosedActivitiesTimesheets(userId, startDate, endDate);

  const closedActivitiesByDate = new Map();

  closedActivitiesRows.forEach(row => {
    const date = row.timesheet_date;

    if (!closedActivitiesByDate.has(date)) {
      closedActivitiesByDate.set(date, {
        total_hours: 0,
        all_submitted: true,
        has_any: false
      });
    }

    const dateData = closedActivitiesByDate.get(date);
    dateData.total_hours += parseFloat(row.total_hours);
    dateData.has_any = true;

    if (!row.is_submitted) {
      dateData.all_submitted = false;
    }
  });

  const closedActivitiesTimesheets = Array.from(closedActivitiesByDate.entries())
    .map(([date, data]) => ({
      timesheet_id: null,
      work_date: date,
      hours_worked: data.total_hours,
      is_submitted: data.all_submitted
    }))
    .sort((a, b) => a.work_date.localeCompare(b.work_date));

  if (closedActivitiesTimesheets.length > 0 || closedActivitiesTotalHours > 0) {
    projects.push({
      project_id: null,
      project_key: "CLOSED_ACTIVITIES",
      project_title: "Consuntivi attività chiuse",
      project_type_id: null,
      client_id: null,
      client_key: null,
      client_name: "Attività chiuse",
      client_color: "#999999",
      tasks: [{
        task_id: null,
        task_number: null,
        task_title: "Consuntivi attività chiuse",
        task_description: "Somma dei consuntivi delle attività con stato diverso da IN PROGRESS",
        budget: 0,
        initial_actual: 0,
        total_hours_worked: closedActivitiesTotalHours,
        etc_hours: 0,
        user_non_submitted_hours: 0,
        timesheets: closedActivitiesTimesheets
      }]
    });
  }

  return { projects };
}

async function saveTimesheet(data, user) {
  const userId = user.user_id;

  const taskOwner = await timesheetRepository.findTaskOwner(data.task_id);
  if (!taskOwner) {
    throw serviceError("Task non trovato", 404);
  }

  if (taskOwner.owner_id !== userId) {
    throw serviceError("Non sei autorizzato a inserire ore per questo task", 403);
  }

  const taskCompany = await timesheetRepository.findTaskCompany(data.task_id);
  if (!taskCompany) {
    throw serviceError("Task non trovato", 404);
  }

  const result = await timesheetRepository.upsertTimesheet({
    task_id: data.task_id,
    company_id: taskCompany.company_id,
    user_id: userId,
    work_date: data.work_date,
    hours_worked: data.hours_worked,
    details: data.details,
    external_key: data.external_key
  });

  return {
    timesheet_id: result.timesheet_id,
    task_id: result.task_id,
    user_id: result.user_id,
    work_date: result.timesheet_date,
    hours_worked: parseFloat(result.total_hours),
    details: result.details,
    external_key: result.external_key,
    is_submitted: result.is_submitted
  };
}

async function deleteTimesheet(timesheetId, user) {
  const result = await timesheetRepository.deleteTimesheet(timesheetId, user.user_id);

  if (!result) {
    throw serviceError("Timesheet non trovato o non autorizzato", 404);
  }

  return result.timesheet_id;
}

async function submitTimesheets(timesheetIds, user) {
  const pool = timesheetRepository.getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const validTimesheets = await timesheetRepository.validateTimesheetsForSubmission(timesheetIds, user.user_id, client);

    if (validTimesheets.length === 0) {
      await client.query('COMMIT');
      return { count: 0, snapshot_id: null };
    }

    if (validTimesheets.length !== timesheetIds.length) {
      throw serviceError("Alcuni timesheet non sono validi o già sottomessi", 400);
    }

    const snapshotId = await timesheetRepository.createSnapshot(user.user_id, user.company_id, client);

    const updatedTimesheets = await timesheetRepository.updateTimesheetsWithSnapshotByIds(snapshotId, timesheetIds, user.user_id, client);

    const taskHoursMap = new Map();
    updatedTimesheets.forEach(row => {
      const currentHours = taskHoursMap.get(row.task_id) || 0;
      taskHoursMap.set(row.task_id, currentHours + parseFloat(row.total_hours));
    });

    for (const [taskId, hoursSubmitted] of taskHoursMap) {
      const etc = await timesheetRepository.getTaskETC(taskId, client);
      if (etc) {
        const currentEtc = parseFloat(etc.etc_hours);
        const newEtc = Math.max(0, currentEtc - hoursSubmitted);
        await timesheetRepository.updateTaskETC(taskId, newEtc, client);
      }
    }

    await client.query('COMMIT');

    return {
      count: updatedTimesheets.length,
      snapshot_id: snapshotId
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getMaxSubmittedDate(user) {
  return timesheetRepository.getMaxSubmittedDate(user.user_id);
}

async function getDatesWithTimesheets(startDate, endDate, user) {
  return timesheetRepository.getDatesWithTimesheets(user.user_id, startDate, endDate);
}

async function getPreviewSubmission(user) {
  const rows = await timesheetRepository.getPreviewSubmission(user.user_id);

  if (rows.length === 0) {
    return [];
  }

  const tasksMap = new Map();

  rows.forEach(row => {
    const taskKey = row.task_id;

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
    task.timesheets.push({
      timesheet_id: row.timesheet_id,
      timesheet_date: row.timesheet_date,
      hours: parseFloat(row.total_hours),
      details: row.details
    });
    task.total_hours += parseFloat(row.total_hours);
  });

  return Array.from(tasksMap.values());
}

async function getTMPlanning(startDate, endDate, user) {
  if (user.role_id !== "PM") {
    throw serviceError("Accesso non autorizzato", 403);
  }

  const rows = await timesheetRepository.getTMPlanningData(
    user.company_id,
    startDate,
    endDate,
    user.user_id
  );

  const usersMap = new Map();
  const periodTotals = {};

  rows.forEach(row => {
    if (row.timesheet_date) {
      periodTotals[row.timesheet_date] = (periodTotals[row.timesheet_date] || 0) +
        parseFloat(row.total_hours || 0);
    }

    if (!usersMap.has(row.user_id)) {
      usersMap.set(row.user_id, {
        user_id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        clients: new Map(),
        total_hours_all_clients: 0,
        total_hours_all_clients_all: 0
      });
    }

    const tmUser = usersMap.get(row.user_id);

    if (!tmUser.clients.has(row.client_id)) {
      tmUser.clients.set(row.client_id, {
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_color: row.client_color,
        project_id: row.project_id,
        project_key: row.project_key,
        task_id: row.task_id,
        timesheets: [],
        total_hours_period: 0,
        total_hours_all: parseFloat(row.total_hours_all || 0)
      });
    }

    const client = tmUser.clients.get(row.client_id);

    if (row.timesheet_id) {
      const hours = parseFloat(row.total_hours || 0);
      client.timesheets.push({
        timesheet_id: row.timesheet_id,
        work_date: row.timesheet_date,
        hours_worked: hours,
        details: row.details,
        external_key: row.external_key,
        is_submitted: row.is_submitted
      });
      client.total_hours_period += hours;
      tmUser.total_hours_all_clients += hours;
    }
  });

  const tmUsers = Array.from(usersMap.values()).map(tmUser => {
    const clients = Array.from(tmUser.clients.values());
    const total_hours_all_clients_all = clients.reduce(
      (sum, client) => sum + (client.total_hours_all || 0), 0
    );
    return {
      ...tmUser,
      clients,
      total_hours_all_clients_all
    };
  });

  return {
    tm_users: tmUsers,
    period_totals_by_date: periodTotals
  };
}

async function saveTimesheetForPM(data, user) {
  if (user.role_id !== "PM") {
    throw serviceError("Accesso non autorizzato", 403);
  }

  const taskOwner = await timesheetRepository.findTaskOwner(data.task_id);
  if (!taskOwner) {
    throw serviceError("Task non trovato", 404);
  }

  const taskCompany = await timesheetRepository.findTaskCompany(data.task_id);
  if (!taskCompany) {
    throw serviceError("Task non trovato", 404);
  }

  if (taskCompany.company_id !== user.company_id) {
    throw serviceError("Non sei autorizzato a modificare questo task", 403);
  }

  const result = await timesheetRepository.upsertTimesheet({
    task_id: data.task_id,
    company_id: taskCompany.company_id,
    user_id: taskOwner.owner_id,
    work_date: data.work_date,
    hours_worked: data.hours_worked,
    details: data.details,
    external_key: data.external_key
  });

  return {
    timesheet_id: result.timesheet_id,
    task_id: result.task_id,
    user_id: result.user_id,
    work_date: result.timesheet_date,
    hours_worked: parseFloat(result.total_hours),
    details: result.details,
    external_key: result.external_key,
    is_submitted: result.is_submitted
  };
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
