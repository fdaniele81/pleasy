import clientService from "../services/clientService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const client = await clientService.create(req.body, req.user);
    res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (err) {
    handleError(res, err, "CREATE CLIENT ERR");
  }
}

async function update(req, res) {
  try {
    const client = await clientService.update(req.params.client_id, req.body, req.user);
    res.status(200).json({
      message: "Client updated successfully",
      client,
    });
  } catch (err) {
    handleError(res, err, "UPDATE CLIENT ERR");
  }
}

async function remove(req, res) {
  try {
    const client = await clientService.remove(req.params.client_id, req.user);
    res.status(200).json({
      message: "Client and associated projects deleted successfully",
      client,
    });
  } catch (err) {
    handleError(res, err, "DELETE CLIENT ERR");
  }
}

async function getAll(req, res) {
  try {
    const clients = await clientService.getAll(req.user);
    res.status(200).json({
      message: "Clients retrieved successfully",
      clients,
      total: clients.length
    });
  } catch (err) {
    handleError(res, err, "GET CLIENTS ERR");
  }
}

async function getPhasesConfig(req, res) {
  try {
    const result = await clientService.getPhasesConfig(req.params.client_id, req.user);
    res.status(200).json({
      message: "Project phases configuration retrieved successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "GET CLIENT PHASES CONFIG ERR");
  }
}

async function updatePhasesConfig(req, res) {
  try {
    const client = await clientService.updatePhasesConfig(
      req.params.client_id,
      req.body.project_phases_config,
      req.user
    );
    res.status(200).json({
      message: "Project phases configuration updated successfully",
      client
    });
  } catch (err) {
    handleError(res, err, "UPDATE CLIENT PHASES CONFIG ERR");
  }
}

async function getClientsWithProjects(req, res) {
  try {
    const clients = await clientService.getClientsWithProjects(req.user);
    res.status(200).json({
      message: "Clients retrieved successfully",
      clients,
      total: clients.length
    });
  } catch (err) {
    handleError(res, err, "GET CLIENTS WITH PROJECTS ERR");
  }
}

async function assignUser(req, res) {
  try {
    const task = await clientService.assignUser(
      req.params.client_id,
      req.body.user_id,
      req.user
    );
    res.status(201).json({
      message: "User assigned to client successfully",
      task
    });
  } catch (err) {
    handleError(res, err, "ASSIGN USER TO CLIENT ERR");
  }
}

async function getTMDetails(req, res) {
  try {
    const details = await clientService.getTMDetails(
      req.params.client_id,
      req.user
    );
    res.status(200).json({
      message: "T&M details retrieved successfully",
      ...details
    });
  } catch (err) {
    handleError(res, err, "GET TM DETAILS ERR");
  }
}

async function unassignUser(req, res) {
  try {
    const result = await clientService.unassignUser(
      req.params.client_id,
      req.params.user_id,
      req.user
    );
    res.status(200).json({
      message: "User removed from client successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "UNASSIGN USER FROM CLIENT ERR");
  }
}

async function assignPM(req, res) {
  try {
    const result = await clientService.assignPM(
      req.params.client_id,
      req.params.user_id,
      req.user
    );
    res.status(201).json({
      message: "PM assigned to client successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "ASSIGN PM TO CLIENT ERR");
  }
}

async function unassignPM(req, res) {
  try {
    const result = await clientService.unassignPM(
      req.params.client_id,
      req.params.user_id,
      req.user
    );
    res.status(200).json({
      message: "PM removed from client successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "UNASSIGN PM FROM CLIENT ERR");
  }
}

async function updateTMReconciliation(req, res) {
  try {
    const result = await clientService.updateTMReconciliation(
      req.params.client_id,
      req.body.reconciliation_required,
      req.user
    );
    res.status(200).json({
      message: "Reconciliation flag updated successfully",
      ...result
    });
  } catch (err) {
    handleError(res, err, "UPDATE TM RECONCILIATION ERR");
  }
}

export {
  create,
  update,
  remove,
  getAll,
  getPhasesConfig,
  updatePhasesConfig,
  getClientsWithProjects,
  assignUser,
  getTMDetails,
  unassignUser,
  assignPM,
  unassignPM,
  updateTMReconciliation,
};

export default {
  create,
  update,
  remove,
  getAll,
  getPhasesConfig,
  updatePhasesConfig,
  getClientsWithProjects,
  assignUser,
  getTMDetails,
  unassignUser,
  assignPM,
  unassignPM,
  updateTMReconciliation,
};
