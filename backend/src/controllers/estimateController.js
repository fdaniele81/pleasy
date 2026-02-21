import estimateService from "../services/estimateService.js";
import estimateValidator from "../validators/estimateValidator.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const data = estimateValidator.validateCreateEstimate(req.body);
    const result = await estimateService.createEstimate(data, req.user);

    res.status(201).json({
      message: "Stima creata correttamente",
      estimate: result.estimate
    });
  } catch (err) {
    handleError(res, err, "CREATE ESTIMATE ERR");
  }
}

async function getAll(req, res) {
  try {
    const { client_id, status, project_id } = req.query;

    estimateValidator.validateClientIdParam(client_id);
    estimateValidator.validateProjectIdParam(project_id);

    const estimates = await estimateService.getEstimates(
      { client_id, status, project_id },
      req.user
    );

    res.status(200).json({
      message: "Stime recuperate correttamente",
      estimates,
      total: estimates.length
    });
  } catch (err) {
    handleError(res, err, "GET ESTIMATES ERR");
  }
}

async function getById(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const estimate = await estimateService.getEstimateById(estimateId, req.user);

    res.status(200).json({
      message: "Stima recuperata correttamente",
      estimate
    });
  } catch (err) {
    handleError(res, err, "GET ESTIMATE ERR");
  }
}

async function update(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const data = estimateValidator.validateUpdateEstimate(req.body);
    const estimate = await estimateService.updateEstimate(estimateId, data, req.user);

    res.status(200).json({
      message: "Stima aggiornata correttamente",
      estimate
    });
  } catch (err) {
    handleError(res, err, "UPDATE ESTIMATE ERR");
  }
}

async function remove(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const estimate = await estimateService.deleteEstimate(estimateId, req.user);

    res.status(200).json({
      message: "Stima eliminata correttamente",
      estimate
    });
  } catch (err) {
    handleError(res, err, "DELETE ESTIMATE ERR");
  }
}

async function createTask(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const data = estimateValidator.validateCreateTask(req.body);
    const task = await estimateService.createTask(estimateId, data, req.user);

    res.status(201).json({
      message: "Task creato correttamente",
      task
    });
  } catch (err) {
    handleError(res, err, "CREATE ESTIMATE TASK ERR");
  }
}

async function updateTask(req, res) {
  try {
    const { estimateId, taskId } = estimateValidator.validateTaskIds(
      req.params.estimate_id,
      req.params.task_id
    );
    const data = estimateValidator.validateUpdateTask(req.body);
    const task = await estimateService.updateTask(estimateId, taskId, data, req.user);

    res.status(200).json({
      message: "Task aggiornato correttamente",
      task
    });
  } catch (err) {
    handleError(res, err, "UPDATE ESTIMATE TASK ERR");
  }
}

async function deleteTask(req, res) {
  try {
    const { estimateId, taskId } = estimateValidator.validateTaskIds(
      req.params.estimate_id,
      req.params.task_id
    );
    const task = await estimateService.deleteTask(estimateId, taskId, req.user);

    res.status(200).json({
      message: "Task eliminato correttamente",
      task
    });
  } catch (err) {
    handleError(res, err, "DELETE ESTIMATE TASK ERR");
  }
}

async function clone(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const { title, project_key } = estimateValidator.validateCloneEstimate(req.body);
    const estimate = await estimateService.cloneEstimate(estimateId, title, project_key, req.user);

    res.status(201).json({
      message: "Stima clonata correttamente",
      estimate
    });
  } catch (err) {
    handleError(res, err, "CLONE ESTIMATE ERR");
  }
}

async function convert(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const { project_id } = estimateValidator.validateSimpleConvert(req.body);
    const estimate = await estimateService.simpleConvert(estimateId, project_id, req.user);

    res.status(200).json({
      message: "Stima convertita in progetto correttamente",
      estimate
    });
  } catch (err) {
    handleError(res, err, "CONVERT ESTIMATE ERR");
  }
}

async function saveDraftProject(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const data = estimateValidator.validateSaveDraftProject(req.body);
    const result = await estimateService.saveDraftProject(estimateId, data, req.user);

    res.status(200).json({
      message: "Bozza progetto salvata",
      project_id: result.project_id,
      tasks_created: result.tasks_created
    });
  } catch (err) {
    handleError(res, err, "SAVE DRAFT PROJECT ERR");
  }
}

async function getDraftProject(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const result = await estimateService.getDraftProject(estimateId, req.user);

    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, "GET DRAFT PROJECT ERR");
  }
}

async function convertToProject(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const data = estimateValidator.validateConvertToProject(req.body);
    const result = await estimateService.convertToProject(estimateId, data, req.user);

    res.status(201).json({
      message: "Stima convertita in progetto correttamente",
      project_id: result.project_id,
      tasks_created: result.tasks_created
    });
  } catch (err) {
    handleError(res, err, "CONVERT ESTIMATE TO PROJECT ERR");
  }
}

async function calculateFTE(req, res) {
  try {
    const estimateId = estimateValidator.validateEstimateId(req.params.estimate_id);
    const data = estimateValidator.validateCalculateFTE(req.body);
    const result = await estimateService.calculateFTE(estimateId, data, req.user);

    res.status(200).json({
      message: "FTE calcolati correttamente",
      ...result
    });
  } catch (err) {
    handleError(res, err, "CALCULATE FTE ERR");
  }
}

export {
  create,
  getAll,
  getById,
  update,
  remove,
  createTask,
  updateTask,
  deleteTask,
  clone,
  convert,
  saveDraftProject,
  getDraftProject,
  convertToProject,
  calculateFTE
};

export default {
  create,
  getAll,
  getById,
  update,
  remove,
  createTask,
  updateTask,
  deleteTask,
  clone,
  convert,
  saveDraftProject,
  getDraftProject,
  convertToProject,
  calculateFTE
};
