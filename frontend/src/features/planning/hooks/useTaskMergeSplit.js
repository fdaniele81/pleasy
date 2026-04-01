import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addToast } from '../../../store/slices/toastSlice';
import logger from '../../../utils/logger';
import { formatDateISO } from '../../../utils/date/dateUtils';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
} from '../api/taskEndpoints';
import { useUpdateTaskOrderMutation } from '../api/planningEndpoints';

/**
 * Hook for merging and splitting tasks in Planning.
 * Both operations are blocked if any involved task has actuals (actual > 0).
 */
export function useTaskMergeSplit({ projects, selectedTasks, refetchPlanning, fetchSyncData, confirmFn }) {
  const dispatch = useDispatch();
  const { t } = useTranslation(['planning', 'estimateConversion', 'common']);

  const [createTask] = useCreateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTaskOrder] = useUpdateTaskOrderMutation();

  // Merge modal state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeContext, setMergeContext] = useState(null); // { projectId, tasks }
  const [mergeTitle, setMergeTitle] = useState('');

  // Split modal state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitContext, setSplitContext] = useState(null); // { projectId, task }

  // Processing state
  const [processing, setProcessing] = useState(false);

  /**
   * Check if a task has any actuals (from timesheets or initial_actual).
   */
  const taskHasActuals = (task) => {
    return (task.actual && task.actual > 0) || (task.initial_actual && task.initial_actual > 0);
  };

  /**
   * Get selected task IDs for a specific project.
   */
  const getSelectedTasksForProject = useCallback((projectId) => {
    const project = projects.find(p => p.project_id === projectId);
    if (!project) return [];
    return project.tasks.filter(task => selectedTasks[task.task_id]);
  }, [projects, selectedTasks]);

  /**
   * Start merge: validate and open modal.
   */
  const handleStartMerge = useCallback((projectId) => {
    const tasks = getSelectedTasksForProject(projectId);
    if (tasks.length < 2) {
      dispatch(addToast({ message: t('planning:mergeNeedTwo'), type: 'error' }));
      return;
    }

    // Check for actuals
    const tasksWithActuals = tasks.filter(taskHasActuals);
    if (tasksWithActuals.length > 0) {
      dispatch(addToast({ message: t('planning:mergeBlockedActuals'), type: 'error' }));
      return;
    }

    setMergeContext({ projectId, tasks });
    setMergeTitle(tasks.map(t => t.title).join(' + '));
    setShowMergeModal(true);
  }, [getSelectedTasksForProject, dispatch, t]);

  /**
   * Confirm merge: create new task, delete old ones.
   */
  const handleConfirmMerge = useCallback(async () => {
    if (!mergeContext || !mergeTitle.trim() || processing) return;

    const { projectId, tasks } = mergeContext;
    setProcessing(true);

    try {
      // Sum budgets
      const totalBudget = tasks.reduce((sum, task) => sum + (task.budget || 0), 0);

      // Compute min start_date and max end_date from tasks that have dates
      // Use formatDateISO to normalize to YYYY-MM-DD (avoids timezone shift)
      const startDates = tasks.filter(t => t.start_date).map(t => formatDateISO(t.start_date));
      const endDates = tasks.filter(t => t.end_date).map(t => formatDateISO(t.end_date));
      const minStartDate = startDates.length > 0 ? startDates.sort()[0] : null;
      const maxEndDate = endDates.length > 0 ? endDates.sort().reverse()[0] : null;

      // Create merged task
      await createTask({
        projectId,
        taskData: {
          project_id: projectId,
          title: mergeTitle.trim(),
          description: '',
          budget: totalBudget,
          task_status_id: 'NEW',
          owner_id: null,
          start_date: minStartDate,
          end_date: maxEndDate,
          external_key: null,
          initial_actual: 0,
          etc: 0,
        },
      }).unwrap();

      // Delete old tasks
      for (const task of tasks) {
        await deleteTask({ projectId, taskId: task.task_id }).unwrap();
      }

      await refetchPlanning();
      fetchSyncData?.();

      dispatch(addToast({
        message: t('planning:mergeSuccess', { count: tasks.length }),
        type: 'success',
      }));

      setShowMergeModal(false);
      setMergeContext(null);
      setMergeTitle('');
    } catch (error) {
      logger.error('Merge error:', error);
      dispatch(addToast({
        message: t('planning:mergeError'),
        type: 'error',
      }));
    } finally {
      setProcessing(false);
    }
  }, [mergeContext, mergeTitle, processing, createTask, deleteTask, refetchPlanning, fetchSyncData, dispatch, t]);

  /**
   * Start split: validate and open modal.
   */
  const handleStartSplit = useCallback((projectId) => {
    const tasks = getSelectedTasksForProject(projectId);
    if (tasks.length !== 1) {
      dispatch(addToast({ message: t('planning:splitNeedOne'), type: 'error' }));
      return;
    }

    const task = tasks[0];

    // Check for actuals
    if (taskHasActuals(task)) {
      dispatch(addToast({ message: t('planning:splitBlockedActuals'), type: 'error' }));
      return;
    }

    setSplitContext({ projectId, task });
    setShowSplitModal(true);
  }, [getSelectedTasksForProject, dispatch, t]);

  /**
   * Confirm split: create N new tasks, delete original.
   */
  const handleConfirmSplit = useCallback(async (splitCount, budgets, names) => {
    if (!splitContext || processing) return;

    const { projectId, task } = splitContext;
    setProcessing(true);

    try {
      // Create N new tasks (carry over dates from original if present)
      for (let i = 0; i < splitCount; i++) {
        const title = names?.[i]?.trim() || `${task.title} (${i + 1})`;
        await createTask({
          projectId,
          taskData: {
            project_id: projectId,
            title,
            description: task.description || '',
            budget: budgets[i],
            task_status_id: 'NEW',
            owner_id: null,
            start_date: task.start_date ? formatDateISO(task.start_date) : null,
            end_date: task.end_date ? formatDateISO(task.end_date) : null,
            external_key: task.external_key || null,
            initial_actual: 0,
            etc: 0,
          },
        }).unwrap();
      }

      // Delete original task
      await deleteTask({ projectId, taskId: task.task_id }).unwrap();

      await refetchPlanning();
      fetchSyncData?.();

      dispatch(addToast({
        message: t('planning:splitSuccess', { count: splitCount }),
        type: 'success',
      }));

      setShowSplitModal(false);
      setSplitContext(null);
    } catch (error) {
      logger.error('Split error:', error);
      dispatch(addToast({
        message: t('planning:splitError'),
        type: 'error',
      }));
    } finally {
      setProcessing(false);
    }
  }, [splitContext, processing, createTask, deleteTask, refetchPlanning, fetchSyncData, dispatch, t]);

  const closeMergeModal = useCallback(() => {
    setShowMergeModal(false);
    setMergeContext(null);
    setMergeTitle('');
  }, []);

  const closeSplitModal = useCallback(() => {
    setShowSplitModal(false);
    setSplitContext(null);
  }, []);

  /**
   * Clone selected tasks within a project.
   */
  const handleCloneTasks = useCallback(async (projectId) => {
    const tasks = getSelectedTasksForProject(projectId);
    if (tasks.length === 0) {
      dispatch(addToast({ message: t('planning:cloneNeedOne'), type: 'error' }));
      return;
    }

    setProcessing(true);
    try {
      // Create clones and track original→clone mapping for ordering
      const cloneMap = []; // { originalTaskId, newTaskId }
      for (const task of tasks) {
        const result = await createTask({
          projectId,
          taskData: {
            project_id: projectId,
            title: `${task.title} (${t('common:copy')})`,
            description: task.description || '',
            details: task.task_details || null,
            budget: task.budget || 0,
            task_status_id: task.task_status_id || 'NEW',
            owner_id: task.owner_id || null,
            start_date: task.start_date ? formatDateISO(task.start_date) : null,
            end_date: task.end_date ? formatDateISO(task.end_date) : null,
            external_key: task.external_key || null,
            initial_actual: 0,
            etc: task.etc || 0,
          },
        }).unwrap();
        if (result?.task?.task_id) {
          cloneMap.push({ originalTaskId: task.task_id, newTaskId: result.task.task_id });
        }
      }

      // Insert clones right after their originals in the task order
      if (cloneMap.length > 0) {
        const project = projects.find(p => p.project_id === projectId);
        const currentOrder = project?.tasks.map(t => t.task_id) || [];
        const newOrder = [];
        for (const taskId of currentOrder) {
          newOrder.push(taskId);
          const clone = cloneMap.find(c => c.originalTaskId === taskId);
          if (clone) {
            newOrder.push(clone.newTaskId);
          }
        }
        // Add any clones whose originals weren't in the current order
        for (const clone of cloneMap) {
          if (!newOrder.includes(clone.newTaskId)) {
            newOrder.push(clone.newTaskId);
          }
        }
        await updateTaskOrder({ projectId, taskOrder: newOrder }).unwrap();
      }

      await refetchPlanning();
      fetchSyncData?.();

      dispatch(addToast({
        message: t('planning:cloneSuccess', { count: tasks.length }),
        type: 'success',
      }));
    } catch (error) {
      logger.error('Clone error:', error);
      dispatch(addToast({
        message: t('planning:cloneError'),
        type: 'error',
      }));
    } finally {
      setProcessing(false);
    }
  }, [getSelectedTasksForProject, createTask, updateTaskOrder, projects, refetchPlanning, fetchSyncData, dispatch, t]);

  return {
    // Merge
    showMergeModal,
    mergeTitle,
    setMergeTitle,
    mergeContext,
    handleStartMerge,
    handleConfirmMerge,
    closeMergeModal,

    // Split
    showSplitModal,
    splitContext,
    handleStartSplit,
    handleConfirmSplit,
    closeSplitModal,

    // Clone
    handleCloneTasks,

    // State
    processing,
  };
}
