import { useRef, useCallback } from 'react';
import {
  useUpdateEstimateTaskMutation,
  useCreateEstimateTaskMutation,
  useDeleteEstimateTaskMutation,
} from '../api/estimateEndpoints';
import { useUndoRedoKeyboard } from '../../../hooks/useUndoRedoKeyboard';

const MAX_UNDO_DEPTH = 10;

export function useEstimateEditorUndo({ isEditingRef, cancelEditingRef, activateCellRef }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);

  const [updateEstimateTask] = useUpdateEstimateTaskMutation();
  const [createEstimateTask] = useCreateEstimateTaskMutation();
  const [deleteEstimateTask] = useDeleteEstimateTaskMutation();

  const pushUndo = useCallback((command) => {
    undoStackRef.current = [
      command,
      ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1),
    ];
    redoStackRef.current = [];
  }, []);

  const executeUndo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = undoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    undoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      if (command.type === 'delete') {
        // Undo delete = recreate the task
        const created = await createEstimateTask({
          estimateId: command.estimateId,
          taskData: command.taskData,
        }).unwrap();

        // Update the command with the new taskId for potential redo
        const redoCommand = { ...command, taskId: created.estimate_task_id };
        redoStackRef.current = [redoCommand, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
        activateCellRef.current?.({ ...command, type: 'restore', index: command.index }, created);
      } else {
        const updated = await updateEstimateTask({
          estimateId: command.estimateId,
          taskId: command.taskId,
          taskData: command.previousFields,
        }).unwrap();

        redoStackRef.current = [command, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
        activateCellRef.current?.(command, updated);
      }
    } catch (error) {
      // Undo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [updateEstimateTask, createEstimateTask, activateCellRef]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    redoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      if (command.type === 'delete') {
        // Redo delete = delete the task again
        await deleteEstimateTask({
          estimateId: command.estimateId,
          taskId: command.taskId,
        }).unwrap();

        undoStackRef.current = [command, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
        activateCellRef.current?.({ ...command, type: 'remove' });
      } else {
        const updated = await updateEstimateTask({
          estimateId: command.estimateId,
          taskId: command.taskId,
          taskData: command.newFields,
        }).unwrap();

        undoStackRef.current = [command, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
        activateCellRef.current?.(command, updated);
      }
    } catch (error) {
      // Redo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [updateEstimateTask, deleteEstimateTask, activateCellRef]);

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
