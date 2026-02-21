import { v4 as uuidv4 } from "uuid";
import taskEtcRepository from "../repositories/taskEtcRepository.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import { serviceError } from "../utils/errorHandler.js";

async function getByTaskId(taskId, user) {
  const taskCompany = await taskEtcRepository.getTaskCompanyId(taskId);

  if (!taskCompany) {
    throw serviceError("Task non trovato", 404);
  }

  checkCompanyAccess(user, taskCompany.company_id);

  return await taskEtcRepository.getByTaskId(taskId);
}

async function upsert(data, user) {
  const { task_id, etc_hours } = data;

  if (!task_id || etc_hours === undefined) {
    throw serviceError("task_id e etc_hours sono obbligatori", 400);
  }

  if (etc_hours < 0) {
    throw serviceError("etc_hours non può essere negativo", 400);
  }

  const taskCompany = await taskEtcRepository.getTaskCompanyId(task_id);

  if (!taskCompany) {
    throw serviceError("Task non trovato", 404);
  }

  checkCompanyAccess(user, taskCompany.company_id);

  const etc_id = uuidv4();
  return await taskEtcRepository.upsert(etc_id, task_id, taskCompany.company_id, etc_hours);
}

async function remove(etcId, user) {
  const etc = await taskEtcRepository.getById(etcId);

  if (!etc) {
    throw serviceError("ETC non trovato", 404);
  }

  checkCompanyAccess(user, etc.company_id);

  return await taskEtcRepository.remove(etcId);
}

export {
  getByTaskId,
  upsert,
  remove,
};

export default {
  getByTaskId,
  upsert,
  remove,
};
