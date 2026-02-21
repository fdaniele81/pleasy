import projectService from "../services/projectService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const project = await projectService.create(req.body, req.user);
    res.status(201).json({
      message: "Progetto creato correttamente",
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
      message: "Progetto aggiornato correttamente",
      project,
    });
  } catch (err) {
    handleError(res, err, "UPDATE PROJECT ERR");
  }
}

async function remove(req, res) {
  try {
    const project = await projectService.remove(req.params.project_id, req.user);
    res.status(200).json({
      message: "Progetto eliminato correttamente",
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
      message: "Project Manager aggiunto correttamente",
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
      message: "Project Manager rimosso correttamente",
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
      message: "Project Manager recuperati correttamente",
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
      message: "Project Manager aggiornati correttamente",
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
      message: "Project Manager disponibili recuperati correttamente",
      managers,
    });
  } catch (err) {
    handleError(res, err, "GET AVAILABLE MANAGERS ERR");
  }
}

export {
  create,
  update,
  remove,
  addManager,
  removeManager,
  getManagers,
  updateManagers,
  getAvailableManagers,
};

export default {
  create,
  update,
  remove,
  addManager,
  removeManager,
  getManagers,
  updateManagers,
  getAvailableManagers,
};
