import projectService from "../services/projectService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const project = await projectService.create(req.body, req.user);
    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    handleError(res, err, "CREATE PROJECT ERR");
  }
}

async function update(req, res) {
  try {
    const project = await projectService.update(req.params.project_id, req.body, req.user);
    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (err) {
    handleError(res, err, "UPDATE PROJECT ERR");
  }
}

async function updateTaskOrder(req, res) {
  try {
    const result = await projectService.updateTaskOrder(
      req.params.project_id,
      req.body.task_order,
      req.user
    );
    res.status(200).json({
      message: "Task order updated successfully",
      project: result,
    });
  } catch (err) {
    handleError(res, err, "UPDATE TASK ORDER ERR");
  }
}

async function remove(req, res) {
  try {
    const project = await projectService.remove(req.params.project_id, req.user);
    res.status(200).json({
      message: "Project deleted successfully",
      project,
    });
  } catch (err) {
    handleError(res, err, "DELETE PROJECT ERR");
  }
}

async function addManager(req, res) {
  try {
    const projectManager = await projectService.addManager(
      req.params.project_id,
      req.params.user_id,
      req.user
    );
    res.status(201).json({
      message: "Project Manager added successfully",
      project_manager: projectManager,
    });
  } catch (err) {
    handleError(res, err, "ADD PROJECT MANAGER ERR");
  }
}

async function removeManager(req, res) {
  try {
    const result = await projectService.removeManager(
      req.params.project_id,
      req.params.user_id,
      req.user
    );
    res.status(200).json({
      message: "Project Manager removed successfully",
      project_id: result.project_id,
      user_id: result.user_id,
    });
  } catch (err) {
    handleError(res, err, "REMOVE PROJECT MANAGER ERR");
  }
}

async function getManagers(req, res) {
  try {
    const managers = await projectService.getManagers(req.params.project_id, req.user);
    res.status(200).json({
      message: "Project Managers retrieved successfully",
      project_id: req.params.project_id,
      managers,
    });
  } catch (err) {
    handleError(res, err, "GET PROJECT MANAGERS ERR");
  }
}

async function updateManagers(req, res) {
  try {
    const managers = await projectService.updateManagers(
      req.params.project_id,
      req.body.project_managers,
      req.user
    );
    res.status(200).json({
      message: "Project Managers updated successfully",
      project_id: req.params.project_id,
      managers,
    });
  } catch (err) {
    handleError(res, err, "BULK ASSIGN PROJECT MANAGERS ERR");
  }
}

async function getAvailableManagers(req, res) {
  try {
    const managers = await projectService.getAvailableManagers(req.params.client_id, req.user);
    res.status(200).json({
      message: "Available Project Managers retrieved successfully",
      managers,
    });
  } catch (err) {
    handleError(res, err, "GET AVAILABLE MANAGERS ERR");
  }
}

async function generateKey(req, res) {
  try {
    const result = await projectService.generateKey(req.query.title, req.user);
    res.status(200).json({
      message: "Project code generated successfully",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "GENERATE PROJECT KEY ERR");
  }
}

async function validateKey(req, res) {
  try {
    const result = await projectService.validateKey(req.query.projectKey, req.user);
    res.status(200).json({
      message: "Project code validated successfully",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "VALIDATE PROJECT KEY ERR");
  }
}

export {
  create,
  update,
  updateTaskOrder,
  remove,
  addManager,
  removeManager,
  getManagers,
  updateManagers,
  getAvailableManagers,
  generateKey,
  validateKey,
};

export default {
  create,
  update,
  updateTaskOrder,
  remove,
  addManager,
  removeManager,
  getManagers,
  updateManagers,
  getAvailableManagers,
  generateKey,
  validateKey,
};
