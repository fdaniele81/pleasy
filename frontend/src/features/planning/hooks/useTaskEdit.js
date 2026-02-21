import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../store/slices/toastSlice';
import { formatDateISO } from '../../../utils/date/dateUtils';
import logger from '../../../utils/logger';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskETCMutation,
  useUpdateInitialActualMutation,
  useLazyGetTaskDetailsQuery,
} from '../api/taskEndpoints';

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export function useTaskEdit({
  projects,
  filteredProjects,
  expandedProjects,
  fetchSyncData,
  refetchPlanning,
  setShowInitialActualModal,
  setSelectedTaskForInitialActual,
  fetchAvailableUsers,
  availableUsers,
  confirmFn
}) {
  const dispatch = useDispatch();

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTaskETC] = useUpdateTaskETCMutation();
  const [updateInitialActual] = useUpdateInitialActualMutation();
  const [fetchTaskDetails] = useLazyGetTaskDetailsQuery();

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalProjectId, setTaskModalProjectId] = useState(null);

  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskProject, setSelectedTaskProject] = useState(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);

  const handleCellClick = (taskId, projectId, field, currentValue) => {
    setEditingCell({ taskId, projectId, field });
    setEditValue(currentValue || '');

    if (field === 'assignee' && !availableUsers[projectId]) {
      fetchAvailableUsers(projectId);
    }
  };

  const handleCellBlur = async (taskId, projectId, field, previousValue) => {
    const newValue = editValue;

    if (newValue !== previousValue) {
      try {
        if (field === 'start_date' || field === 'end_date') {
          const task = projects
            .find(p => p.project_id === projectId)
            ?.tasks.find(t => t.task_id === taskId);

          const startDate = field === 'start_date' ? newValue : formatDateISO(task?.start_date);
          const endDate = field === 'end_date' ? newValue : formatDateISO(task?.end_date);

          await updateTask({
            taskId,
            projectId,
            taskData: {
              start_date: startDate || null,
              end_date: endDate || null
            }
          }).unwrap();

          await refetchPlanning();
        } else if (field === 'status') {
          if (newValue === 'IN PROGRESS') {
            const task = projects
              .find(p => p.project_id === projectId)
              ?.tasks.find(t => t.task_id === taskId);

            const missingFields = [];
            if (!task?.owner_id) missingFields.push('utente');
            if (!task?.start_date) missingFields.push('data inizio');
            if (!task?.end_date) missingFields.push('data fine');

            if (missingFields.length > 0) {
              dispatch(addToast({
                message: `Per impostare lo stato "IN PROGRESS" è necessario selezionare: ${missingFields.join(', ')}`,
                type: 'error'
              }));
              setEditingCell(null);
              setEditValue('');
              return;
            }
          }

          await updateTask({
            taskId,
            projectId,
            taskData: { task_status_id: newValue }
          }).unwrap();

          await refetchPlanning();
        } else if (field === 'assignee') {
          const normalizedOwnerId = newValue?.trim() || null;
          await updateTask({
            taskId,
            projectId,
            taskData: { owner_id: normalizedOwnerId }
          }).unwrap();

          await refetchPlanning();
        } else if (field === 'etc') {
          await updateTaskETC({
            taskId,
            etc: parseFloat(newValue) || 0
          }).unwrap();

          await refetchPlanning();
        } else if (field === 'title' || field === 'description' || field === 'budget' || field === 'external_key') {
          const taskData = {};
          if (field === 'budget') {
            taskData[field] = parseFloat(newValue) || 0;
          } else if (field === 'external_key') {
            taskData[field] = newValue.trim() === '' ? null : newValue;
          } else {
            taskData[field] = newValue;
          }

          await updateTask({
            taskId,
            projectId,
            taskData
          }).unwrap();

          await refetchPlanning();

          if (field === 'external_key') {
            fetchSyncData();
          }
        }
      } catch (error) {
        logger.error('Errore aggiornamento:', error);
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const editableFields = ['title', 'external_key', 'status', 'assignee', 'budget', 'etc', 'start_date', 'end_date'];

  const getNextCell = (currentTaskId, currentProjectId, currentField) => {
    const currentFieldIndex = editableFields.indexOf(currentField);

    if (currentFieldIndex < editableFields.length - 1) {
      return {
        taskId: currentTaskId,
        projectId: currentProjectId,
        field: editableFields[currentFieldIndex + 1]
      };
    }

    const projectIndex = filteredProjects.findIndex(p => p.project_id === currentProjectId);
    if (projectIndex === -1) return null;

    const currentProject = filteredProjects[projectIndex];
    const taskIndex = currentProject.tasks.findIndex(t => t.task_id === currentTaskId);

    if (taskIndex < currentProject.tasks.length - 1) {
      const nextTask = currentProject.tasks[taskIndex + 1];
      return {
        taskId: nextTask.task_id,
        projectId: currentProjectId,
        field: editableFields[0]
      };
    }

    for (let i = projectIndex + 1; i < filteredProjects.length; i++) {
      const nextProject = filteredProjects[i];
      if (nextProject.tasks.length > 0 && expandedProjects[nextProject.project_id]) {
        const firstTask = nextProject.tasks[0];
        return {
          taskId: firstTask.task_id,
          projectId: nextProject.project_id,
          field: editableFields[0]
        };
      }
    }

    return null;
  };

  const handleKeyDown = async (e, taskId, projectId, field, previousValue) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();

      await handleCellBlur(taskId, projectId, field, previousValue);

      const nextCell = getNextCell(taskId, projectId, field);

      if (nextCell) {
        const project = filteredProjects.find(p => p.project_id === nextCell.projectId);
        if (project) {
          const task = project.tasks.find(t => t.task_id === nextCell.taskId);
          if (task) {
            let currentValue = '';
            switch (nextCell.field) {
              case 'title':
                currentValue = task.title || '';
                break;
              case 'external_key':
                currentValue = task.external_key || '';
                break;
              case 'status':
                currentValue = task.task_status_id || '';
                break;
              case 'assignee':
                currentValue = task.owner_id || '';
                break;
              case 'budget':
                currentValue = task.budget?.toString() || '0';
                break;
              case 'etc':
                currentValue = task.etc?.toString() || '0';
                break;
              case 'start_date':
                currentValue = task.start_date ? formatDateISO(task.start_date) : '';
                break;
              case 'end_date':
                currentValue = task.end_date ? formatDateISO(task.end_date) : '';
                break;
              default:
                currentValue = '';
            }

            setEditingCell(nextCell);
            setEditValue(currentValue);
          }
        }
      }
    }
  };

  const handleStartAddingTask = (projectId) => {
    if (!availableUsers[projectId]) {
      fetchAvailableUsers(projectId);
    }

    setTaskModalProjectId(projectId);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setTaskModalProjectId(null);
  };

  const handleSaveNewTask = async (taskData) => {
    const projectId = taskModalProjectId;
    if (!projectId) return;

    const normalizedOwnerId = taskData.owner_id?.trim() || null;

    const formattedTaskData = {
      project_id: projectId,
      title: taskData.title,
      description: taskData.description || '',
      details: taskData.task_details || null,
      budget: parseFloat(taskData.budget) || 0,
      task_status_id: taskData.task_status_id,
      owner_id: normalizedOwnerId,
      start_date: taskData.start_date || null,
      end_date: taskData.end_date || null,
      external_key: taskData.external_key || null,
      initial_actual: parseFloat(taskData.initial_actual) || 0,
      etc: parseFloat(taskData.etc) || 0,
    };

    try {
      await createTask({ projectId, taskData: formattedTaskData }).unwrap();
      await refetchPlanning();
      if (formattedTaskData.external_key || formattedTaskData.initial_actual > 0) {
        fetchSyncData();
      }
      handleCloseTaskModal();
    } catch (error) {
      logger.error('Errore creazione task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (projectId, taskId, taskTitle) => {
    const confirmed = await confirmFn({
      title: 'Elimina attività',
      message: `Sei sicuro di voler eliminare l'attività "${taskTitle}"?`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      variant: 'danger'
    });
    if (confirmed) {
      try {
        await deleteTask({ projectId, taskId }).unwrap();
        await refetchPlanning();
        fetchSyncData();
      } catch (error) {
        logger.error('Errore eliminazione task:', error);
      }
    }
  };

  const handleInitialActualClick = (task) => {
    setSelectedTaskForInitialActual(task);
    setShowInitialActualModal(true);
  };

  const handleInitialActualConfirm = async (initialActualValue, taskId) => {
    if (!taskId) return;

    try {
      await updateInitialActual({
        taskId: taskId,
        initialActual: initialActualValue
      }).unwrap();

      refetchPlanning();
      fetchSyncData();

      setShowInitialActualModal(false);
      setSelectedTaskForInitialActual(null);
    } catch (error) {
      logger.error('Errore aggiornamento initial actual:', error);
    }
  };

  const handleTaskDetailsClick = async (task, project) => {
    try {
      setLoadingTaskDetails(true);

      if (!availableUsers[project.project_id]) {
        fetchAvailableUsers(project.project_id);
      }

      const { data: taskDetails } = await fetchTaskDetails(task.task_id);

      const enrichedTask = {
        ...task,
        ...taskDetails,
      };

      setSelectedTask(enrichedTask);
      setSelectedTaskProject(project);
      setShowTaskDetailsModal(true);
    } catch (error) {
      logger.error('Errore nel caricamento dei dettagli del task:', error);
      dispatch(addToast({
        message: 'Errore nel caricamento dei dettagli dell\'attività',
        type: 'error'
      }));
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const handleCloseTaskDetailsModal = () => {
    setShowTaskDetailsModal(false);
    setSelectedTask(null);
    setSelectedTaskProject(null);
  };

  const handleSaveEditTask = async (taskData) => {
    if (!selectedTask || !selectedTaskProject) return;

    const projectId = selectedTaskProject.project_id;
    const taskId = taskData.task_id;

    const normalizedOwnerId = taskData.owner_id?.trim() || null;

    const formattedTaskData = {
      title: taskData.title,
      description: taskData.description || '',
      details: taskData.task_details || null,
      budget: parseFloat(taskData.budget) || 0,
      task_status_id: taskData.task_status_id,
      owner_id: normalizedOwnerId,
      start_date: taskData.start_date || null,
      end_date: taskData.end_date || null,
      external_key: taskData.external_key || null,
    };

    try {
      await updateTask({
        taskId,
        projectId,
        taskData: formattedTaskData
      }).unwrap();

      const initialActualChanged = parseFloat(taskData.initial_actual) !== selectedTask.initial_actual;
      const etcChanged = parseFloat(taskData.etc) !== selectedTask.etc;

      if (initialActualChanged) {
        await updateInitialActual({
          taskId: taskId,
          initialActual: parseFloat(taskData.initial_actual) || 0
        }).unwrap();
      }

      if (etcChanged) {
        await updateTaskETC({
          taskId,
          etc: parseFloat(taskData.etc) || 0
        }).unwrap();
      }

      await refetchPlanning();
      handleCloseTaskDetailsModal();

      if (taskData.external_key !== selectedTask.external_key || initialActualChanged) {
        fetchSyncData();
      }
    } catch (error) {
      logger.error('Errore modifica task:', error);
      throw error;
    }
  };

  return {
    editingCell,
    editValue,
    setEditValue,

    showTaskModal,
    taskModalProjectId,

    showTaskDetailsModal,
    selectedTask,
    selectedTaskProject,
    loadingTaskDetails,

    handleCellClick,
    handleCellBlur,
    handleKeyDown,
    handleStartAddingTask,
    handleCloseTaskModal,
    handleSaveNewTask,
    handleDeleteTask,
    handleInitialActualClick,
    handleInitialActualConfirm,
    handleTaskDetailsClick,
    handleCloseTaskDetailsModal,
    handleSaveEditTask,
  };
}
