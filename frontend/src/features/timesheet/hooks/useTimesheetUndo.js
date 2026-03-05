import { useRef, useCallback, useEffect } from 'react';
import {
  useSaveTimesheetMutation,
  useSaveTimeOffMutation,
} from '../api/timesheetEndpoints';

const MAX_UNDO_DEPTH = 10;

export function useTimesheetUndo({ isEditingRef, cancelEditingRef, activateCellRef }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);

  const [saveTimesheet] = useSaveTimesheetMutation();
  const [saveTimeOff] = useSaveTimeOffMutation();

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
      switch (command.type) {
        case 'SAVE_TASK':
        case 'DELETE_TASK': {
          await saveTimesheet({
            taskId: command.taskId,
            workDate: command.workDate,
            hoursWorked: command.previousHours,
            notes: null,
            details: command.previousDetails || null,
            externalKey: command.externalKey,
          }).unwrap();
          break;
        }
        case 'SAVE_TIMEOFF': {
          await saveTimeOff({
            timeOffTypeId: command.timeOffTypeId,
            date: command.date,
            hours: command.previousHours,
            details: command.previousDetails || '',
          }).unwrap();
          break;
        }
        default:
          break;
      }
      redoStackRef.current = [command, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      activateCellRef.current?.(command);
    } catch (error) {
      // Undo failed silently — command is discarded
    } finally {
      isUndoingRef.current = false;
    }
  }, [saveTimesheet, saveTimeOff, activateCellRef]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;

    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    const command = stack[0];
    redoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      switch (command.type) {
        case 'SAVE_TASK': {
          await saveTimesheet({
            taskId: command.taskId,
            workDate: command.workDate,
            hoursWorked: command.newHours,
            notes: null,
            details: command.newDetails || null,
            externalKey: command.externalKey,
          }).unwrap();
          break;
        }
        case 'DELETE_TASK': {
          await saveTimesheet({
            taskId: command.taskId,
            workDate: command.workDate,
            hoursWorked: 0,
            notes: null,
            details: null,
            externalKey: command.externalKey,
          }).unwrap();
          break;
        }
        case 'SAVE_TIMEOFF': {
          await saveTimeOff({
            timeOffTypeId: command.timeOffTypeId,
            date: command.date,
            hours: command.newHours,
            details: command.newDetails || '',
          }).unwrap();
          break;
        }
        default:
          break;
      }
      undoStackRef.current = [command, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];
      const activateCommand = { ...command, previousHours: command.newHours };
      activateCellRef.current?.(activateCommand);
    } catch (error) {
      // Redo failed silently — command is discarded
    } finally {
      isUndoingRef.current = false;
    }
  }, [saveTimesheet, saveTimeOff, activateCellRef]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));
      if (!isUndo && !isRedo) return;

      const activeEl = document.activeElement;
      const isInInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if (isUndo) {
        if (undoStackRef.current.length === 0) return;
        if (isInInput && !isEditingRef.current) return;
        e.preventDefault();
        cancelEditingRef.current?.();
        executeUndo();
      } else if (isRedo) {
        e.preventDefault();
        if (redoStackRef.current.length === 0) return;
        if (isInInput && !isEditingRef.current) return;
        cancelEditingRef.current?.();
        executeRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeUndo, executeRedo, isEditingRef, cancelEditingRef]);

  return { pushUndo };
}
