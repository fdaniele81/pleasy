import projectDraftService from "../services/projectDraftService.js";
import { handleError } from "../utils/errorHandler.js";

async function createOrUpdate(req, res) {
  try {
    const result = await projectDraftService.createOrUpdate(req.body, req.user);

    res.status(201).json({
      message: result.isUpdate ? 'Project draft aggiornato con successo' : 'Project draft creato con successo',
      projectDraft: result.projectDraft,
      tasks: result.tasks
    });
  } catch (err) {
    handleError(res, err, "CREATE/UPDATE PROJECT DRAFT ERR");
  }
}

async function getById(req, res) {
  try {
    const result = await projectDraftService.getById(req.params.project_draft_id, req.user);

    res.json({
      projectDraft: result.projectDraft,
      tasks: result.tasks
    });
  } catch (err) {
    handleError(res, err, "GET PROJECT DRAFT ERR");
  }
}

async function getByEstimateId(req, res) {
  try {
    const result = await projectDraftService.getByEstimateId(req.params.estimate_id, req.user);

    res.json(result);
  } catch (err) {
    handleError(res, err, "GET PROJECT DRAFTS BY ESTIMATE ERR");
  }
}

async function remove(req, res) {
  try {
    await projectDraftService.remove(req.params.project_draft_id, req.user);

    res.json({
      message: 'Project draft eliminato con successo'
    });
  } catch (err) {
    handleError(res, err, "DELETE PROJECT DRAFT ERR");
  }
}

async function convert(req, res) {
  try {
    const result = await projectDraftService.convert(req.params.project_draft_id, req.user);

    res.status(201).json({
      message: 'Project draft convertito con successo in progetto reale',
      project: result.project,
      tasks: result.tasks
    });
  } catch (err) {
    handleError(res, err, "CONVERT PROJECT DRAFT ERR");
  }
}

async function checkProjectKey(req, res) {
  try {
    const result = await projectDraftService.checkProjectKey(req.params.project_key);

    res.json(result);
  } catch (err) {
    handleError(res, err, "CHECK PROJECT KEY ERR");
  }
}

export {
  createOrUpdate,
  getById,
  getByEstimateId,
  remove,
  convert,
  checkProjectKey,
};

export default {
  createOrUpdate,
  getById,
  getByEstimateId,
  remove,
  convert,
  checkProjectKey,
};
