import { v4 as uuidv4 } from "uuid";
import projectDraftRepository from "../repositories/projectDraftRepository.js";
import { isValidUUID, clientNotExistsError } from "../utils/dbValidations.js";
import { serviceError } from "../utils/errorHandler.js";

async function createOrUpdate(data, user) {
  const {
    project_draft_id,
    estimate_id,
    client_id,
    project_key,
    tasks
  } = data;

  const userId = user.user_id;
  const userRole = user.role_id;
  const userCompanyId = user.company_id;

  if (!estimate_id || !isValidUUID(estimate_id)) {
    throw serviceError('estimate_id valido è obbligatorio', 400);
  }

  if (!client_id || !isValidUUID(client_id)) {
    throw serviceError('client_id valido è obbligatorio', 400);
  }

  if (!project_key || project_key.trim() === '') {
    throw serviceError('project_key è obbligatorio', 400);
  }

  await projectDraftRepository.beginTransaction();

  try {
    const estimate = await projectDraftRepository.getEstimateWithCompany(estimate_id);

    if (!estimate) {
      await projectDraftRepository.rollbackTransaction();
      throw serviceError('Estimate non trovato', 404);
    }

    if (userRole !== 'ADMIN') {
      if (estimate.company_id !== userCompanyId) {
        await projectDraftRepository.rollbackTransaction();
        throw serviceError('Non hai i permessi per accedere a questo estimate', 403);
      }
    }

    let finalProjectDraftId = project_draft_id;
    let projectDraft;
    let isUpdate = false;

    if (!project_draft_id || !isValidUUID(project_draft_id)) {
      const existingDraftId = await projectDraftRepository.findDraftByEstimateId(estimate_id);
      if (existingDraftId) {
        finalProjectDraftId = existingDraftId;
        isUpdate = true;
      }
    } else {
      isUpdate = true;
    }

    if (isUpdate && finalProjectDraftId) {
      projectDraft = await projectDraftRepository.updateProjectDraft(finalProjectDraftId, estimate_id, data);

      if (!projectDraft) {
        await projectDraftRepository.rollbackTransaction();
        throw serviceError('Project draft non trovato o non appartiene a questo estimate', 404);
      }

      if (tasks !== undefined) {
        await projectDraftRepository.deleteTaskDrafts(finalProjectDraftId);
      }
    } else {
      finalProjectDraftId = uuidv4();
      projectDraft = await projectDraftRepository.createProjectDraft(finalProjectDraftId, estimate_id, data, userId);
    }

    const createdTasks = [];
    if (tasks !== undefined) {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskDraftId = uuidv4();
        const taskResult = await projectDraftRepository.createTaskDraft(
          taskDraftId, estimate_id, finalProjectDraftId, task, i, userId
        );
        createdTasks.push(taskResult);
      }
    }

    await projectDraftRepository.commitTransaction();

    return {
      isUpdate: !!project_draft_id,
      projectDraft,
      tasks: createdTasks
    };
  } catch (err) {
    await projectDraftRepository.rollbackTransaction();
    throw err;
  }
}

async function getById(projectDraftId, user) {
  const userRole = user.role_id;
  const userCompanyId = user.company_id;

  if (!isValidUUID(projectDraftId)) {
    throw serviceError('project_draft_id non valido', 400);
  }

  const projectDraft = await projectDraftRepository.getProjectDraftById(projectDraftId);

  if (!projectDraft) {
    throw serviceError('Project draft non trovato', 404);
  }

  if (userRole !== 'ADMIN' && projectDraft.company_id !== userCompanyId) {
    throw serviceError('Non hai i permessi per accedere a questo project draft', 403);
  }

  const tasks = await projectDraftRepository.getTaskDrafts(projectDraftId);

  return { projectDraft, tasks };
}

async function getByEstimateId(estimateId, user) {
  const userRole = user.role_id;
  const userCompanyId = user.company_id;

  if (!isValidUUID(estimateId)) {
    throw serviceError('estimate_id non valido', 400);
  }

  const estimate = await projectDraftRepository.getEstimateWithCompany(estimateId);

  if (!estimate) {
    throw serviceError('Estimate non trovato', 404);
  }

  if (userRole !== 'ADMIN' && estimate.company_id !== userCompanyId) {
    throw serviceError('Non hai i permessi per accedere a questo estimate', 403);
  }

  const drafts = await projectDraftRepository.getProjectDraftsByEstimateId(estimateId);

  const draftsWithTasks = await Promise.all(
    drafts.map(async (draft) => {
      const tasks = await projectDraftRepository.getTaskDrafts(draft.project_draft_id);
      return { ...draft, tasks };
    })
  );

  return {
    estimateId: estimateId,
    drafts: draftsWithTasks,
    total: draftsWithTasks.length
  };
}

async function remove(projectDraftId, user) {
  const userRole = user.role_id;
  const userCompanyId = user.company_id;

  if (!isValidUUID(projectDraftId)) {
    throw serviceError('project_draft_id non valido', 400);
  }

  const draftCheck = await projectDraftRepository.getDraftCompanyId(projectDraftId);

  if (!draftCheck) {
    throw serviceError('Project draft non trovato', 404);
  }

  if (userRole !== 'ADMIN' && draftCheck.company_id !== userCompanyId) {
    throw serviceError('Non hai i permessi per eliminare questo project draft', 403);
  }

  await projectDraftRepository.deleteProjectDraft(projectDraftId);
}

async function convert(projectDraftId, user) {
  const userRole = user.role_id;
  const userCompanyId = user.company_id;

  if (!isValidUUID(projectDraftId)) {
    throw serviceError('project_draft_id non valido', 400);
  }

  await projectDraftRepository.beginTransaction();

  try {
    const draft = await projectDraftRepository.getProjectDraftById(projectDraftId);

    if (!draft) {
      await projectDraftRepository.rollbackTransaction();
      throw serviceError('Project draft non trovato', 404);
    }

    if (userRole !== 'ADMIN' && draft.company_id !== userCompanyId) {
      await projectDraftRepository.rollbackTransaction();
      throw serviceError('Non hai i permessi per convertire questo project draft', 403);
    }

    await clientNotExistsError(draft.client_id);

    const existingProjectId = await projectDraftRepository.checkProjectKeyExists(draft.project_key);

    let projectId;
    let project;
    let isExistingProject = false;

    if (existingProjectId) {
      projectId = existingProjectId;
      isExistingProject = true;
    } else {
      projectId = uuidv4();
      project = await projectDraftRepository.createProject(
        projectId, draft.client_id, draft.project_key, draft.title, draft.status_id
      );

      if (draft.project_details && draft.project_details.project_managers) {
        for (const pmUserId of draft.project_details.project_managers) {
          await projectDraftRepository.addProjectManager(projectId, pmUserId);
        }
      }
    }

    const taskDrafts = await projectDraftRepository.getTaskDrafts(projectDraftId);

    const taskNumberOffset = isExistingProject
      ? await projectDraftRepository.getMaxTaskNumber(projectId)
      : 0;

    const createdTasks = [];
    for (const taskDraft of taskDrafts) {
      const taskId = uuidv4();
      const actualTaskNumber = taskDraft.task_number + taskNumberOffset;

      await projectDraftRepository.upsertTaskSequence(projectId, actualTaskNumber);

      const task = await projectDraftRepository.createTask(
        taskId, actualTaskNumber, projectId,
        taskDraft.title, taskDraft.description,
        taskDraft.budget, taskDraft.initial_actual
      );

      if (taskDraft.budget && parseFloat(taskDraft.budget) > 0) {
        const etcId = uuidv4();
        await projectDraftRepository.createTaskEtc(etcId, taskId, draft.company_id, taskDraft.budget);
      }

      createdTasks.push(task);
    }

    await projectDraftRepository.updateDraftProjectId(projectDraftId, projectId);

    if (draft.estimate_id) {
      await projectDraftRepository.updateEstimateAsConverted(draft.estimate_id, projectId);
    }

    await projectDraftRepository.deleteProjectDraft(projectDraftId);

    await projectDraftRepository.commitTransaction();

    return { project, tasks: createdTasks, isExistingProject };
  } catch (err) {
    await projectDraftRepository.rollbackTransaction();
    throw err;
  }
}

async function checkProjectKey(projectKey) {
  if (!projectKey || projectKey.trim() === '') {
    throw serviceError('project_key è obbligatorio', 400);
  }

  const result = await projectDraftRepository.getProjectWithTasksByKey(projectKey.trim());

  return { exists: !!result, project: result };
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
