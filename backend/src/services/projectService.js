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
    throw serviceError("PROJECT_REQUIRED_FIELDS", "Client, project code and title are required", 400);
  }

  await clientNotExistsError(client_id);
  if (status_id) {
    await statusNotExistsError(status_id);
  }

  const clientCompanyId = await projectRepository.getClientCompanyId(client_id);
  checkCompanyAccess(user, clientCompanyId);

  const exists = await projectRepository.checkProjectKeyExistsByCompany(user.company_id, project_key);
  if (exists) {
    throw serviceError("PROJECT_CODE_DUPLICATE", "Project code already exists for this company", 409);
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
    throw serviceError("PROJECT_TITLE_REQUIRED", "Project title is required", 400);
  }

  await projectNotExistsError(projectId);
  if (status_id) {
    await statusNotExistsError(status_id);
  }

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.updateProject(projectId, title, description, status_id, project_details);
}

async function updateTaskOrder(projectId, taskOrder, user) {
  if (!Array.isArray(taskOrder)) {
    throw serviceError("TASK_ORDER_MUST_BE_ARRAY", "task_order must be an array of task IDs", 400);
  }

  await projectNotExistsError(projectId);

  const companyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, companyId);

  return await projectRepository.updateTaskOrder(projectId, taskOrder.length > 0 ? taskOrder : null);
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
    throw serviceError("PROJECT_PM_ROLE_REQUIRED", "User must have PM or ADMIN role", 400);
  }

  const projectCompanyId = await projectRepository.getProjectCompanyId(projectId);
  checkCompanyAccess(user, projectCompanyId);

  const userCompanyId = await projectRepository.getUserCompanyId(userId);
  if (userCompanyId !== projectCompanyId) {
    throw serviceError("PROJECT_PM_COMPANY_MISMATCH", "User must belong to the same company as the project", 403);
  }

  const exists = await projectRepository.checkProjectManagerExists(projectId, userId);
  if (exists) {
    throw serviceError("PROJECT_PM_ALREADY_ASSIGNED", "User already assigned as PM to this project", 409);
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
    throw serviceError("PROJECT_PM_NOT_ASSIGNED", "User not assigned as PM to this project", 404);
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
    throw serviceError("PROJECT_PM_MUST_BE_ARRAY", "project_managers must be an array", 400);
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
        throw serviceError("PROJECT_PM_ROLE_REQUIRED", "All users must have PM or ADMIN role", 400);
      }

      const userCompanyId = await projectRepository.getUserCompanyId(userId);
      if (userCompanyId !== projectCompanyId) {
        throw serviceError("PROJECT_PM_COMPANY_MISMATCH", "All users must belong to the same company as the project", 403);
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

function generateKeyCandidates(title) {
  if (!title || !title.trim()) return [];

  const words = title.trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.toUpperCase());

  if (words.length === 0) return [];

  const candidates = [];

  if (words.length === 1) {
    for (let len = 6; len <= 10; len++) {
      candidates.push(words[0].substring(0, len));
    }
  } else if (words.length === 2) {
    const combos = [[3,3], [4,3], [3,4], [4,4], [5,4], [4,5], [5,5]];
    for (const [a, b] of combos) {
      candidates.push(words[0].substring(0, a) + words[1].substring(0, b));
    }
  } else {
    candidates.push(words[0].substring(0, 3) + words[1].substring(0, 3));
    candidates.push(words[0].substring(0, 3) + words[1].substring(0, 3) + words[2].substring(0, 3));
    candidates.push(words[0].substring(0, 4) + words[1].substring(0, 3) + words[2].substring(0, 3));
    candidates.push(words[0].substring(0, 3) + words[1].substring(0, 4) + words[2].substring(0, 3));
    candidates.push(words[0].substring(0, 3) + words[1].substring(0, 3) + words[2].substring(0, 4));
  }

  const seen = new Set();
  return candidates.filter(c => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

async function generateKey(title, user) {
  if (!title || !title.trim()) {
    throw serviceError("PROJECT_TITLE_REQUIRED_FOR_KEY", "Project title is required to generate the code", 400);
  }

  const companyId = user.company_id;
  const candidates = generateKeyCandidates(title);

  for (const candidate of candidates) {
    if (!(await projectRepository.checkProjectKeyExistsByCompany(companyId, candidate))) {
      return { project_key: candidate };
    }
  }

  const baseCandidate = candidates[candidates.length - 1];
  for (let suffix = 2; suffix <= 99; suffix++) {
    const suffixStr = String(suffix);
    const maxBaseLen = 10 - suffixStr.length;
    const candidateKey = baseCandidate.substring(0, maxBaseLen) + suffixStr;

    if (!(await projectRepository.checkProjectKeyExistsByCompany(companyId, candidateKey))) {
      return { project_key: candidateKey };
    }
  }

  throw serviceError("PROJECT_KEY_GENERATION_FAILED", "Unable to generate a unique project code", 500);
}

async function validateKey(projectKey, user) {
  if (!projectKey) {
    throw serviceError("PROJECT_CODE_REQUIRED", "Project code is required", 400);
  }

  const companyId = user.company_id;
  const baseKey = projectKey.trim().toUpperCase();

  const exists = await projectRepository.checkProjectKeyExistsByCompany(companyId, baseKey);
  if (!exists) {
    return { project_key: baseKey, original_available: true };
  }

  for (let suffix = 2; suffix <= 99; suffix++) {
    const suffixStr = String(suffix);
    const maxBaseLen = 10 - suffixStr.length;
    const candidateKey = baseKey.substring(0, maxBaseLen) + suffixStr;

    if (!(await projectRepository.checkProjectKeyExistsByCompany(companyId, candidateKey))) {
      return { project_key: candidateKey, original_available: false };
    }
  }

  throw serviceError("PROJECT_KEY_GENERATION_FAILED", "Unable to generate a unique project code", 500);
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
