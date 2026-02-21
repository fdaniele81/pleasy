import { v4 as uuidv4 } from "uuid";
import projectRepository from "../repositories/projectRepository.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import { serviceError } from "../utils/errorHandler.js";
import {
  clientNotExistsError,
  projectNotExistsError,
  statusNotExistsError,
  userNotExistsError,
} from "../utils/dbValidations.js";

async function create(data, user) {
  const { client_id, project_key, title, description, status_id, project_details, project_managers } = data;

  if (!client_id || !project_key || !title) {
    throw serviceError("Cliente, codice progetto e titolo sono obbligatori", 400);
  }

  await clientNotExistsError(client_id);
  if (status_id) {
    await statusNotExistsError(status_id);
  }

  const clientCompanyId = await projectRepository.getClientCompanyId(client_id);
  checkCompanyAccess(user, clientCompanyId);

  const exists = await projectRepository.checkProjectKeyExists(client_id, project_key);
  if (exists) {
    throw serviceError("Codice progetto già presente per questo cliente", 409);
  }

  const project_id = uuidv4();
  const projectStatus = status_id || 'ACTIVE';

  await projectRepository.beginTransaction();

  try {
    const project = await projectRepository.createProject(
      project_id, client_id, project_key, title, description, projectStatus, project_details
    );

    if (project_managers && Array.isArray(project_managers) && project_managers.length > 0) {
      for (const user_id of project_managers) {
        await userNotExistsError(user_id);
        await projectRepository.addProjectManager(project_id, user_id);
      }
    }

    await projectRepository.commitTransaction();
    return project;
  } catch (err) {
    await projectRepository.rollbackTransaction();
    throw err;
  }
}

async function update(projectId, data, user) {
  const { title, description, status_id, project_details } = data;

  if (!title) {
    throw serviceError("Titolo progetto è obbligatorio", 400);
  }

  await projectNotExistsError(projectId);
  if (status_id) {
    await statusNotExistsError(status_id);
  }

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.updateProject(projectId, title, description, status_id, project_details);
}

async function remove(projectId, user) {
  await projectNotExistsError(projectId);

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.deleteProject(projectId);
}

async function addManager(projectId, userId, user) {
  await projectNotExistsError(projectId);
  await userNotExistsError(userId);

  const userRole = await projectRepository.getUserRole(userId);
  if (userRole !== 'PM' && userRole !== 'ADMIN') {
    throw serviceError("L'utente deve avere ruolo PM o ADMIN", 400);
  }

  const projectCompanyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, projectCompanyId);

  const userCompanyId = await projectRepository.getUserCompanyId(userId);
  if (userCompanyId !== projectCompanyId) {
    throw serviceError("L'utente deve appartenere alla stessa company del progetto", 403);
  }

  const exists = await projectRepository.checkProjectManagerExists(projectId, userId);
  if (exists) {
    throw serviceError("Utente già assegnato come PM a questo progetto", 409);
  }

  await projectRepository.addProjectManager(projectId, userId);
  return await projectRepository.getUserInfo(userId);
}

async function removeManager(projectId, userId, user) {
  await projectNotExistsError(projectId);
  await userNotExistsError(userId);

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  const exists = await projectRepository.checkProjectManagerExists(projectId, userId);
  if (!exists) {
    throw serviceError("Utente non assegnato come PM a questo progetto", 404);
  }

  await projectRepository.removeProjectManager(projectId, userId);
  return { project_id: projectId, user_id: userId };
}

async function getManagers(projectId, user) {
  await projectNotExistsError(projectId);

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.getProjectManagers(projectId);
}

async function updateManagers(projectId, projectManagers, user) {
  if (!Array.isArray(projectManagers)) {
    throw serviceError("project_managers deve essere un array", 400);
  }

  await projectNotExistsError(projectId);

  const projectCompanyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, projectCompanyId);

  await projectRepository.beginTransaction();

  try {
    await projectRepository.deleteAllProjectManagers(projectId);

    for (const userId of projectManagers) {
      await userNotExistsError(userId);

      const userRole = await projectRepository.getUserRole(userId);
      if (userRole !== 'PM' && userRole !== 'ADMIN') {
        throw serviceError("Tutti gli utenti devono avere ruolo PM o ADMIN", 400);
      }

      const userCompanyId = await projectRepository.getUserCompanyId(userId);
      if (userCompanyId !== projectCompanyId) {
        throw serviceError("Tutti gli utenti devono appartenere alla stessa company del progetto", 403);
      }

      await projectRepository.addProjectManager(projectId, userId);
    }

    await projectRepository.commitTransaction();
    return await projectRepository.getProjectManagers(projectId);
  } catch (err) {
    await projectRepository.rollbackTransaction();
    throw err;
  }
}

async function getAvailableManagers(clientId, user) {
  await clientNotExistsError(clientId);

  const companyId = await projectRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.getAvailableManagers(companyId);
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
