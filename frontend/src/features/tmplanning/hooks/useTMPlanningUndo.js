import { useRef, useCallback } from 'react';
import { useSaveTMTimesheetMutation } from '../api/tmPlanningEndpoints';
import { useUndoRedoKeyboard } from '../../../hooks/useUndoRedoKeyboard';

const MAX_UNDO_DEPTH = 10;

export function useTMPlanningUndo({ isEditingRef, cancelEditingRef, activateCellRef }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);

  const [saveTMTimesheet] = useSaveTMTimesheetMutation();

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
      await saveTMTimesheet({
        taskId: command.taskId,
        workDate: command.workDate,
        hoursWorked: command.previousHours,
        details: command.previousDetails || null,
        externalKey: command.externalKey,
      }).unwrap();

      redoStackRef.current = [command, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      activateCellRef.current?.(command);
    } catch (error) {
      // Undo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [saveTMTimesheet, activateCellRef]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    redoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      await saveTMTimesheet({
        taskId: command.taskId,
        workDate: command.workDate,
        hoursWorked: command.newHours,
        details: command.newDetails || null,
        externalKey: command.externalKey,
      }).unwrap();

      undoStackRef.current = [command, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      const activateCommand = { ...command, previousHours: command.newHours };
      activateCellRef.current?.(activateCommand);
    } catch (error) {
      // Redo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [saveTMTimesheet, activateCellRef]);

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
