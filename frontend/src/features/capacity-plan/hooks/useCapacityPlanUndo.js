import { useRef, useCallback } from 'react';
import { useUndoRedoKeyboard } from '../../../hooks/useUndoRedoKeyboard';

const MAX_UNDO_DEPTH = 20;

/**
 * Hook per gestire undo/redo (Ctrl+Z / Ctrl+Y) nella vista Capacity Plan.
 * Traccia le modifiche agli intervalli delle fasi (drag Gantt).
 */
export function useCapacityPlanUndo({ updateEstimateIntervals }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);
  const isEditingRef = useRef(false);
  const cancelEditingRef = useRef(null);

  /**
   * Salva un comando nello stack undo.
   * Chiamare PRIMA di applicare la modifica, passando previousIntervals e newIntervals.
   */
  const pushUndo = useCallback((command) => {
    undoStackRef.current = [
      command,
      ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1),
    ];
    redoStackRef.current = [];
  }, []);

  const executeUndo = useCallback(async () => {
    if (isUndoingRef.current) return;
    if (undoStackRef.current.length === 0) return;

    isUndoingRef.current = true;
    const command = undoStackRef.current[0];
    undoStackRef.current = undoStackRef.current.slice(1);

    try {
      if (command.type === 'UPDATE_INTERVALS') {
        await updateEstimateIntervals(command.estimateId, command.previousIntervals);
        redoStackRef.current = [command, ...redoStackRef.current];
      }
    } catch (error) {
      console.error('Errore undo capacity plan:', error);
    } finally {
      isUndoingRef.current = false;
    }
  }, [updateEstimateIntervals]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;
    if (redoStackRef.current.length === 0) return;

    isUndoingRef.current = true;
    const command = redoStackRef.current[0];
    redoStackRef.current = redoStackRef.current.slice(1);

    try {
      if (command.type === 'UPDATE_INTERVALS') {
        await updateEstimateIntervals(command.estimateId, command.newIntervals);
        undoStackRef.current = [command, ...undoStackRef.current];
      }
    } catch (error) {
      console.error('Errore redo capacity plan:', error);
    } finally {
      isUndoingRef.current = false;
    }
  }, [updateEstimateIntervals]);

  useUndoRedoKeyboard({
    isEditingRef,
    cancelEditingRef,
    executeUndo,
    executeRedo,
    undoStackRef,
    redoStackRef,
  });

  return { pushUndo, isUndoingRef };
}
