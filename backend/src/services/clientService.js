import { v4 as uuidv4 } from "uuid";
import clientRepository from "../repositories/clientRepository.js";
import projectRepository from "../repositories/projectRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import { companyNotExistsError, clientNotExistsError, userNotExistsError } from "../utils/dbValidations.js";
import { DEFAULT_PROJECT_PHASES_CONFIG, isValidConfig } from "../config/projectPhasesConfig.js";
import { serviceError } from "../utils/errorHandler.js";

async function create(data, user) {
  const { company_id, client_key, client_name, client_description, color, project_phases_config } = data;

  if (!company_id || !client_key || !client_name) {
    throw serviceError("Company, codice cliente e nome sono obbligatori", 400);
  }

  checkCompanyAccess(user, company_id);
  await companyNotExistsError(company_id);

  const exists = await clientRepository.checkClientKeyExists(company_id, client_key);
  if (exists) {
    throw serviceError("Codice cliente già presente per questa company", 409);
  }

  const client_id = uuidv4();
  const phasesConfig = isValidConfig(project_phases_config) ? project_phases_config : DEFAULT_PROJECT_PHASES_CONFIG;

  await clientRepository.beginTransaction();

  try {
    const client = await clientRepository.createClient(
      client_id, company_id, client_key, client_name, client_description, color, phasesConfig
    );

    const project_id = uuidv4();
    const projectKey = `${client_key}_TM`;
    await projectRepository.createProject(
      project_id,
      client_id,
      projectKey,
      `${client_name} - Time & Materials`,
      null,
      'ACTIVE',
      null,
      'TM'
    );

    await clientRepository.commitTransaction();
    return client;
  } catch (err) {
    await clientRepository.rollbackTransaction();
    throw err;
  }
}

async function update(clientId, data, user) {
  const { client_name, client_description, status_id, color, project_phases_config } = data;

  if (!client_name) {
    throw serviceError("Nome cliente è obbligatorio", 400);
  }

  await clientNotExistsError(clientId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const client = await clientRepository.updateClient(
    clientId, client_name, client_description, status_id, color, project_phases_config
  );

  return {
    ...client,
    project_phases_config: isValidConfig(client.project_phases_config) ? client.project_phases_config : DEFAULT_PROJECT_PHASES_CONFIG
  };
}

async function remove(clientId, user) {
  await clientNotExistsError(clientId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  await clientRepository.beginTransaction();

  try {
    await clientRepository.deleteClientProjects(clientId);
    const client = await clientRepository.deleteClient(clientId);
    await clientRepository.commitTransaction();
    return client;
  } catch (err) {
    await clientRepository.rollbackTransaction();
    throw err;
  }
}

async function getAll(user) {
  const clients = await clientRepository.getAllClients(user.role_id, user.company_id);

  return clients.map(client => ({
    ...client,
    project_phases_config: isValidConfig(client.project_phases_config) ? client.project_phases_config : DEFAULT_PROJECT_PHASES_CONFIG
  }));
}

async function getPhasesConfig(clientId, user) {
  await clientNotExistsError(clientId);

  const client = await clientRepository.getClientById(clientId);
  checkCompanyAccess(user, client.company_id);

  return {
    client_id: client.client_id,
    client_key: client.client_key,
    client_name: client.client_name,
    project_phases_config: isValidConfig(client.project_phases_config) ? client.project_phases_config : DEFAULT_PROJECT_PHASES_CONFIG
  };
}

async function updatePhasesConfig(clientId, phasesConfig, user) {
  if (!phasesConfig) {
    throw serviceError("Configurazione fasi progetto è obbligatoria", 400);
  }

  await clientNotExistsError(clientId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  return await clientRepository.updatePhasesConfig(clientId, phasesConfig);
}

async function getClientsWithProjects(user) {
  const rows = await clientRepository.getClientsWithProjects(user.role_id, user.company_id);

  const clientsMap = new Map();

  rows.forEach(row => {
    const clientId = row.client_id;

    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        client_id: row.client_id,
        company_id: row.company_id,
        client_key: row.client_key,
        client_name: row.client_name,
        client_description: row.client_description,
        color: row.color,
        status_id: row.client_status_id,
        project_phases_config: isValidConfig(row.project_phases_config) ? row.project_phases_config : DEFAULT_PROJECT_PHASES_CONFIG,
        projects: []
      });
    }

    const client = clientsMap.get(clientId);

    if (row.project_id) {
      let project = client.projects.find(p => p.project_id === row.project_id);

      if (!project) {
        project = {
          project_id: row.project_id,
          project_key: row.project_key,
          title: row.project_title,
          description: row.project_description,
          status_id: row.project_status_id,
          project_details: row.project_details,
          project_type_id: row.project_type_id,
          project_managers: []
        };
        client.projects.push(project);
      }

      if (row.pm_user_id && !project.project_managers.find(pm => pm.user_id === row.pm_user_id)) {
        project.project_managers.push({
          user_id: row.pm_user_id,
          full_name: row.pm_full_name,
          email: row.pm_email
        });
      }
    }
  });

  return Array.from(clientsMap.values());
}

async function assignUser(clientId, userId, user) {
  if (!clientId || !userId) {
    throw serviceError("Client ID e User ID sono obbligatori", 400);
  }

  await clientNotExistsError(clientId);
  await userNotExistsError(userId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const tmProject = await clientRepository.getTMProjectByClientId(clientId);
  if (!tmProject) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  const existingTask = await taskRepository.findByOwnerAndProject(userId, tmProject.project_id);

  if (existingTask) {
    const task = await taskRepository.updateStatus(existingTask.task_id, 'IN PROGRESS');
    return {
      task_id: task.task_id,
      task_number: task.task_number,
      title: task.title,
      owner_id: task.owner_id,
      start_date: task.start_date,
      end_date: task.end_date,
      task_status_id: task.task_status_id
    };
  }

  const userInfo = await projectRepository.getUserInfo(userId);

  await taskRepository.beginTransaction();

  try {
    const taskNumber = await taskRepository.getNextTaskNumber(tmProject.project_id);

    const taskData = {
      task_number: taskNumber,
      project_id: tmProject.project_id,
      external_key: `${tmProject.project_key}`,
      title: userInfo.full_name,
      description: `Task T&M per ${userInfo.full_name}`,
      task_status_id: 'IN PROGRESS',
      owner_id: userId,
      budget: 0,
      start_date: '0001-01-01',
      end_date: '9999-12-31'
    };

    const { task } = await taskRepository.create(taskData);

    await taskRepository.commitTransaction();

    return {
      task_id: task.task_id,
      task_number: task.task_number,
      title: task.title,
      owner_id: task.owner_id,
      start_date: task.start_date,
      end_date: task.end_date,
      task_status_id: task.task_status_id
    };
  } catch (err) {
    await taskRepository.rollbackTransaction();
    throw err;
  }
}

async function getTMDetails(clientId, user) {
  await clientNotExistsError(clientId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const rows = await clientRepository.getTMProjectDetails(clientId);

  if (rows.length === 0) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  const projectId = rows[0].project_id;
  const projectManagers = [];
  const tmUsers = [];

  const pmSet = new Set();
  const tmUserSet = new Set();

  rows.forEach(row => {
    if (row.pm_user_id && !pmSet.has(row.pm_user_id)) {
      pmSet.add(row.pm_user_id);
      projectManagers.push({
        user_id: row.pm_user_id,
        full_name: row.pm_full_name,
        email: row.pm_email
      });
    }

    if (row.tm_user_id && !tmUserSet.has(row.tm_user_id)) {
      tmUserSet.add(row.tm_user_id);
      tmUsers.push({
        user_id: row.tm_user_id,
        full_name: row.tm_full_name,
        email: row.tm_email,
        task_id: row.task_id
      });
    }
  });

  return {
    project_id: projectId,
    reconciliation_required: rows[0].reconciliation_required,
    project_managers: projectManagers,
    tm_users: tmUsers
  };
}

async function unassignUser(clientId, userId, user) {
  if (!clientId || !userId) {
    throw serviceError("Client ID e User ID sono obbligatori", 400);
  }

  await clientNotExistsError(clientId);
  await userNotExistsError(userId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const tmProject = await clientRepository.getTMProjectByClientId(clientId);
  if (!tmProject) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  const existingTask = await taskRepository.findByOwnerAndProject(userId, tmProject.project_id, true);

  if (!existingTask) {
    throw serviceError("Utente non assegnato a questo cliente", 404);
  }

  const deletedTask = await taskRepository.softDelete(existingTask.task_id);

  return {
    task_id: deletedTask.task_id,
    task_number: deletedTask.task_number,
    title: deletedTask.title,
    task_status_id: deletedTask.task_status_id
  };
}

async function assignPM(clientId, userId, user) {
  if (!clientId || !userId) {
    throw serviceError("Client ID e User ID sono obbligatori", 400);
  }

  await clientNotExistsError(clientId);
  await userNotExistsError(userId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const userInfo = await projectRepository.getUserInfo(userId);
  if (!userInfo || (userInfo.role_id !== 'PM' && userInfo.role_id !== 'ADMIN')) {
    throw serviceError("L'utente deve avere ruolo PM o ADMIN", 400);
  }

  const tmProject = await clientRepository.getTMProjectByClientId(clientId);
  if (!tmProject) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  const alreadyAssigned = await projectRepository.checkProjectManagerExists(tmProject.project_id, userId);
  if (alreadyAssigned) {
    throw serviceError("PM già assegnato a questo cliente", 409);
  }

  await projectRepository.addProjectManager(tmProject.project_id, userId);

  return {
    project_id: tmProject.project_id,
    user_id: userId,
    full_name: userInfo.full_name,
    email: userInfo.email
  };
}

async function unassignPM(clientId, userId, user) {
  if (!clientId || !userId) {
    throw serviceError("Client ID e User ID sono obbligatori", 400);
  }

  await clientNotExistsError(clientId);
  await userNotExistsError(userId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const tmProject = await clientRepository.getTMProjectByClientId(clientId);
  if (!tmProject) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  const isAssigned = await projectRepository.checkProjectManagerExists(tmProject.project_id, userId);
  if (!isAssigned) {
    throw serviceError("PM non assegnato a questo cliente", 404);
  }

  await projectRepository.removeProjectManager(tmProject.project_id, userId);

  return {
    project_id: tmProject.project_id,
    user_id: userId
  };
}

async function updateTMReconciliation(clientId, reconciliationRequired, user) {
  if (reconciliationRequired === undefined || reconciliationRequired === null) {
    throw serviceError("Il campo reconciliation_required è obbligatorio", 400);
  }

  await clientNotExistsError(clientId);

  const companyId = await clientRepository.getClientCompanyId(clientId);
  checkCompanyAccess(user, companyId);

  const result = await clientRepository.updateTMReconciliation(clientId, reconciliationRequired);
  if (!result) {
    throw serviceError("Progetto T&M non trovato per questo cliente", 404);
  }

  return result;
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
