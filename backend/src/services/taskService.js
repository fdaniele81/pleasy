import taskRepository from "../repositories/taskRepository.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import {
  projectNotExistsError,
  userNotExistsError,
} from "../utils/dbValidations.js";
import { serviceError } from "../utils/errorHandler.js";
import { getFTEReport } from "./fteService.js";

async function getProjectsWithTasks(user) {
  const rows = await taskRepository.getProjectsWithTasks(user);

  const projectsMap = new Map();

  rows.forEach((row) => {
    const projectId = row.project_id;

    if (!projectsMap.has(projectId)) {
      projectsMap.set(projectId, {
        project_id: row.project_id,
        project_key: row.project_key,
        title: row.project_title,
        description: row.project_description,
        status_id: row.status_id,
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        company_id: row.company_id,
        tasks: [],
      });
    }

    if (row.task_id) {
      projectsMap.get(projectId).tasks.push({
        task_id: row.task_id,
        task_number: row.task_number,
        title: row.task_title,
        description: row.task_description,
        task_details: row.task_details || null,
        task_status_id: row.task_status_id,
        owner_id: row.owner_id,
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        budget: row.budget,
        initial_actual: row.initial_actual,
        start_date: row.start_date,
        end_date: row.end_date,
      });
    }
  });

  return Array.from(projectsMap.values());
}

async function createTask(data, user) {
  await projectNotExistsError(data.project_id);

  const projectCompanyId = await taskRepository.getCompanyIdFromProject(data.project_id);
  checkCompanyAccess(user, projectCompanyId);

  if (data.owner_id) {
    await userNotExistsError(data.owner_id);
    const ownerCompanyId = await taskRepository.getCompanyIdFromUser(data.owner_id);
    if (ownerCompanyId !== projectCompanyId) {
      throw serviceError(
        "L'utente selezionato non appartiene alla stessa azienda del progetto",
        400
      );
    }
  }

  await taskRepository.beginTransaction();

  try {
    const taskNumber = await taskRepository.getNextTaskNumber(data.project_id);

    const { task, task_id } = await taskRepository.create({
      ...data,
      task_number: taskNumber,
    });

    if (data.budget) {
      await taskRepository.createTaskETC(
        task_id,
        projectCompanyId,
        data.budget
      );
    }

    await taskRepository.commitTransaction();
    return task;
  } catch (err) {
    await taskRepository.rollbackTransaction();
    throw err;
  }
}

async function updateTask(taskId, data, user) {
  const existing = await taskRepository.findById(taskId);
  if (!existing) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, existing.company_id);

  if (data.owner_id && data.owner_id !== existing.owner_id) {
    await userNotExistsError(data.owner_id);
    const ownerCompanyId = await taskRepository.getCompanyIdFromUser(data.owner_id);
    if (ownerCompanyId !== existing.company_id) {
      throw serviceError(
        "L'utente selezionato non appartiene alla stessa azienda del progetto",
        400
      );
    }
  }

  await taskRepository.beginTransaction();

  try {
    const task = await taskRepository.update(taskId, data);
    await taskRepository.commitTransaction();
    return task;
  } catch (err) {
    await taskRepository.rollbackTransaction();
    throw err;
  }
}

async function deleteTask(taskId, user) {
  const task = await taskRepository.findById(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return taskRepository.softDelete(taskId);
}

async function getPMPlanning(user) {
  const rows = await taskRepository.getPMPlanningData(
    user.user_id,
    user.company_id
  );

  const projectsMap = new Map();

  rows.forEach((row) => {
    const projectId = row.project_id;

    if (!projectsMap.has(projectId)) {
      projectsMap.set(projectId, {
        project_id: row.project_id,
        project_key: row.project_key,
        title: row.project_title,
        description: row.project_description,
        status_id: row.status_id,
        project_type_id: row.project_type_id,
        created_at: row.project_created_at,
        client_id: row.client_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_color: row.client_color,
        tasks: new Map(),
      });
    }

    const project = projectsMap.get(projectId);

    if (row.task_id && row.task_status_id !== "DELETED") {
      if (!project.tasks.has(row.task_id)) {
        project.tasks.set(row.task_id, {
          task_id: row.task_id,
          task_number: row.task_number,
          external_key: row.external_key,
          title: row.task_title,
          description: row.task_description,
          task_status_id: row.task_status_id,
          owner_id: row.owner_id,
          owner_name: row.owner_name,
          owner_email: row.owner_email,
          budget: parseFloat(row.budget) || 0,
          initial_actual: parseFloat(row.initial_actual) || 0,
          actual: parseFloat(row.actual_hours) || 0,
          non_submitted_hours: parseFloat(row.non_submitted_hours) || 0,
          etc_hours: parseFloat(row.etc_hours) || 0,
          start_date: row.start_date,
          end_date: row.end_date,
        });
      }
    }
  });

  const projects = Array.from(projectsMap.values()).map((project) => {
    const tasks = Array.from(project.tasks.values()).map((task) => {
      const etc_value = task.etc_hours;
      const eac = task.actual + etc_value;
      const delta = task.budget - eac;
      const progress = eac > 0 ? (task.actual / eac) * 100 : 0;
      const budget_residuo = etc_value - task.non_submitted_hours;

      return {
        ...task,
        etc: etc_value,
        eac: eac,
        delta: delta,
        progress: Math.round(progress * 10) / 10,
        budget_residuo: budget_residuo,
      };
    });

    const project_budget = tasks.reduce((sum, t) => sum + t.budget, 0);
    const project_actual = tasks.reduce((sum, t) => sum + t.actual, 0);
    const project_etc = tasks.reduce((sum, t) => sum + t.etc, 0);
    const project_eac = project_actual + project_etc;
    const project_delta = project_budget - project_eac;
    const project_progress =
      project_eac > 0 ? (project_actual / project_eac) * 100 : 0;

    return {
      ...project,
      tasks: tasks,
      metrics: {
        budget: project_budget,
        actual: project_actual,
        etc: project_etc,
        eac: project_eac,
        delta: project_delta,
        progress: Math.round(project_progress * 10) / 10,
      },
    };
  });

  return projects;
}

async function getAvailableUsers(projectId, user) {
  await projectNotExistsError(projectId);

  const projectCompanyId = await taskRepository.getCompanyIdFromProject(projectId);
  checkCompanyAccess(user, projectCompanyId);

  return taskRepository.getAvailableUsers(projectCompanyId);
}

async function updateInitialActual(taskId, initialActual, user) {
  const task = await taskRepository.findById(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return taskRepository.updateInitialActual(taskId, initialActual);
}

async function updateTaskETC(taskId, etcHours, user) {
  const task = await taskRepository.findById(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return taskRepository.updateTaskETC(taskId, task.company_id, etcHours);
}

async function getTaskDetails(taskId, user) {
  const task = await taskRepository.getTaskDetailsFull(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  return {
    task_id: task.task_id,
    task_number: task.task_number,
    external_key: task.external_key,
    title: task.title,
    description: task.description,
    task_details: task.task_details,
    task_status_id: task.task_status_id,
    owner_id: task.owner_id,
    owner_name: task.owner_name,
    owner_email: task.owner_email,
    budget: parseFloat(task.budget) || 0,
    initial_actual: parseFloat(task.initial_actual) || 0,
    start_date: task.start_date,
    end_date: task.end_date,
    created_at: task.created_at,
    updated_at: task.updated_at,
    project_id: task.project_id,
    project_key: task.project_key,
    project_title: task.project_title,
    client_name: task.client_name,
  };
}

async function getUserTaskDetails(taskId, user) {
  const task = await taskRepository.getTaskDetailsUser(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  if (task.owner_id !== user.user_id) {
    throw serviceError(
      "Non sei autorizzato a visualizzare i dettagli di questa attività",
      403
    );
  }

  return {
    task_id: task.task_id,
    task_number: task.task_number,
    title: task.title,
    description: task.description,
    task_details: task.task_details,
    project_key: task.project_key,
    project_title: task.project_title,
    client_name: task.client_name,
  };
}

async function updateUserTaskDetails(taskId, taskDetails, user) {
  const task = await taskRepository.getTaskDetailsUser(taskId);
  if (!task) {
    throw serviceError("Attività non trovata", 404);
  }

  checkCompanyAccess(user, task.company_id);

  if (task.owner_id !== user.user_id) {
    throw serviceError(
      "Non sei autorizzato a modificare i dettagli di questa attività",
      403
    );
  }

  return taskRepository.updateTaskDetails(taskId, taskDetails);
}

export {
  getProjectsWithTasks,
  createTask,
  updateTask,
  deleteTask,
  getPMPlanning,
  getAvailableUsers,
  updateInitialActual,
  updateTaskETC,
  getTaskDetails,
  getUserTaskDetails,
  updateUserTaskDetails,
  getFTEReport,
};

export default {
  getProjectsWithTasks,
  createTask,
  updateTask,
  deleteTask,
  getPMPlanning,
  getAvailableUsers,
  updateInitialActual,
  updateTaskETC,
  getTaskDetails,
  getUserTaskDetails,
  updateUserTaskDetails,
  getFTEReport,
};
