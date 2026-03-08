import taskService from "../services/taskService.js";
import taskValidator from "../validators/taskValidator.js";
import { handleError } from "../utils/errorHandler.js";
import taskRepository from "../repositories/taskRepository.js";

async function getProjectTasks(req, res) {
  try {
    const projects = await taskService.getProjectsWithTasks(req.user);

    res.status(200).json({
      message: "Projects and tasks retrieved successfully",
      projects,
      total: projects.length
    });
  } catch (err) {
    handleError(res, err, "GET PROJECTS WITH TASKS ERR");
  }
}

async function create(req, res) {
  try {
    const data = taskValidator.validateCreateTask(req.body);
    const task = await taskService.createTask(data, req.user);

    res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "CREATE TASK ERR");
  }
}

async function update(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);

    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "TASK_NOT_FOUND", message: "Task not found" });
    }

    const data = taskValidator.validateUpdateTask(req.body, existingTask);
    const task = await taskService.updateTask(taskId, data, req.user);

    res.status(200).json({
      message: "Task updated successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "UPDATE TASK ERR");
  }
}

async function remove(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const task = await taskService.deleteTask(taskId, req.user);

    res.status(200).json({
      message: "Task deleted successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "DELETE TASK ERR");
  }
}

async function getPMPlanning(req, res) {
  try {
    const projects = await taskService.getPMPlanning(req.user);

    res.status(200).json({
      message: "PM planning retrieved successfully",
      projects,
      total: projects.length
    });
  } catch (err) {
    handleError(res, err, "GET PM PLANNING ERR");
  }
}

async function getAvailableUsers(req, res) {
  try {
    const projectId = taskValidator.validateProjectId(req.params.project_id);
    const users = await taskService.getAvailableUsers(projectId, req.user);

    res.status(200).json({
      message: "Available users retrieved successfully",
      users
    });
  } catch (err) {
    handleError(res, err, "GET AVAILABLE USERS ERR");
  }
}

async function updateInitialActual(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const { initial_actual } = taskValidator.validateInitialActual(req.body);
    const task = await taskService.updateInitialActual(taskId, initial_actual, req.user);

    res.status(200).json({
      message: "Initial actual updated successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "UPDATE INITIAL ACTUAL ERR");
  }
}

async function updateTaskETC(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const { etc } = req.body;

    if (etc === undefined || etc === null) {
      return res.status(400).json({ error: "TASK_ETC_REQUIRED", message: "etc is required" });
    }

    const etcHours = parseFloat(etc);
    if (isNaN(etcHours) || etcHours < 0) {
      return res.status(400).json({ error: "TASK_ETC_INVALID", message: "etc must be a non-negative number" });
    }

    const result = await taskService.updateTaskETC(taskId, etcHours, req.user);

    res.status(200).json({
      message: "ETC updated successfully",
      etc: result
    });
  } catch (err) {
    handleError(res, err, "UPDATE TASK ETC ERR");
  }
}

async function getTaskDetails(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const task = await taskService.getTaskDetails(taskId, req.user);

    res.status(200).json({
      message: "Task details retrieved successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "GET TASK DETAILS ERR");
  }
}

async function getUserTaskDetails(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const task = await taskService.getUserTaskDetails(taskId, req.user);

    res.status(200).json({
      message: "Task details retrieved successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "GET USER TASK DETAILS ERR");
  }
}

async function updateUserTaskDetails(req, res) {
  try {
    const taskId = taskValidator.validateTaskId(req.params.task_id);
    const { task_details } = req.body;
    const task = await taskService.updateUserTaskDetails(taskId, task_details, req.user);

    res.status(200).json({
      message: "Task details updated successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "UPDATE USER TASK DETAILS ERR");
  }
}

async function getFTEReport(req, res) {
  try {
    const { startDate, endDate, diffDays, etcReferenceDate } = taskValidator.validateFTEReportParams(req.query);
    const result = await taskService.getFTEReport(startDate, endDate, diffDays, req.user, etcReferenceDate);

    res.status(200).json({
      message: "FTE report retrieved successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "GET FTE REPORT ERR");
  }
}

export {
  getProjectTasks,
  create,
  update,
  remove,
  getPMPlanning,
  getAvailableUsers,
  updateInitialActual,
  updateTaskETC,
  getTaskDetails,
  getUserTaskDetails,
  updateUserTaskDetails,
  getFTEReport
};

export default {
  getProjectTasks,
  create,
  update,
  remove,
  getPMPlanning,
  getAvailableUsers,
  updateInitialActual,
  updateTaskETC,
  getTaskDetails,
  getUserTaskDetails,
  updateUserTaskDetails,
  getFTEReport
};
