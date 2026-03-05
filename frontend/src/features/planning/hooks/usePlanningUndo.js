import { useRef, useCallback } from 'react';
import {
  useUpdateTaskMutation,
  useUpdateTaskETCMutation,
} from '../api/taskEndpoints';
import { useUndoRedoKeyboard } from '../../../hooks/useUndoRedoKeyboard';

const MAX_UNDO_DEPTH = 10;

export function usePlanningUndo({ isEditingRef, cancelEditingRef, activateCellRef, refetchPlanning, fetchSyncData }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);

  const [updateTask] = useUpdateTaskMutation();
  const [updateTaskETC] = useUpdateTaskETCMutation();

  const pushUndo = useCallback((command) => {
    undoStackRef.current = [
      command,
      ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1),
    ];
    redoStackRef.current = [];
  }, []);

  const applyFieldValue = useCallback(async (command, value) => {
    const { taskId, projectId, field } = command;

    if (field === 'start_date' || field === 'end_date') {
      await updateTask({
        taskId,
        projectId,
        taskData: value,
      }).unwrap();
    } else if (field === 'etc') {
      await updateTaskETC({ taskId, etc: value }).unwrap();
    } else if (field === 'status') {
      await updateTask({ taskId, projectId, taskData: { task_status_id: value } }).unwrap();
    } else if (field === 'assignee') {
      await updateTask({ taskId, projectId, taskData: { owner_id: value } }).unwrap();
    } else if (field === 'budget') {
      await updateTask({ taskId, projectId, taskData: { budget: value } }).unwrap();
    } else if (field === 'external_key') {
      await updateTask({ taskId, projectId, taskData: { external_key: value } }).unwrap();
    } else {
      await updateTask({ taskId, projectId, taskData: { [field]: value } }).unwrap();
    }

    await refetchPlanning();
    if (field === 'external_key') {
      fetchSyncData();
    }
  }, [updateTask, updateTaskETC, refetchPlanning, fetchSyncData]);

  const executeUndo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = undoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    undoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      await applyFieldValue(command, command.previousValue);
      redoStackRef.current = [command, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      activateCellRef.current?.(command, command.previousValue);
    } catch (error) {
      // Undo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [applyFieldValue, activateCellRef]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    redoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      await applyFieldValue(command, command.newValue);
      undoStackRef.current = [command, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      activateCellRef.current?.(command, command.newValue);
    } catch (error) {
      // Redo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [applyFieldValue, activateCellRef]);

  useUndoRedoKeyboard({
    isEditingRef,
    cancelEditingRef,
    executeUndo,
    executeRedo,
    undoStackRef,
    redoStackRef,
  });

  return { pushUndo };
}
