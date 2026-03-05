import { useRef, useCallback } from 'react';
import { useUndoRedoKeyboard } from '../../../hooks/useUndoRedoKeyboard';

const MAX_UNDO_DEPTH = 10;

export function useConversionUndo({ restoreState, saveDraftFn }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isUndoingRef = useRef(false);

  const isEditingRef = useRef(false);
  const cancelEditingRef = useRef(null);

  const pushSnapshot = useCallback((snapshot) => {
    undoStackRef.current = [
      snapshot,
      ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1),
    ];
    redoStackRef.current = [];
  }, []);

  const clearStacks = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, []);

  const executeUndo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = undoStackRef.current;
    if (stack.length === 0) return;

    const snapshot = stack[0];
    undoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      // Capture current state before restoring (for redo)
      const currentSnapshot = restoreState.captureSnapshot();
      redoStackRef.current = [currentSnapshot, ...redoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];

      const rows = restoreState.restoreSnapshot(snapshot);
      await saveDraftFn.current?.(rows);
    } catch (error) {
      // Undo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [restoreState, saveDraftFn]);

  const executeRedo = useCallback(async () => {
    if (isUndoingRef.current) return;
    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    const snapshot = stack[0];
    redoStackRef.current = stack.slice(1);
    isUndoingRef.current = true;

    try {
      // Capture current state before restoring (for undo)
      const currentSnapshot = restoreState.captureSnapshot();
      undoStackRef.current = [currentSnapshot, ...undoStackRef.current.slice(0, MAX_UNDO_DEPTH - 1)];

      const rows = restoreState.restoreSnapshot(snapshot);
      await saveDraftFn.current?.(rows);
    } catch (error) {
      // Redo failed silently
    } finally {
      isUndoingRef.current = false;
    }
  }, [restoreState, saveDraftFn]);

  useUndoRedoKeyboard({
    isEditingRef,
    cancelEditingRef,
    executeUndo,
    executeRedo,
    undoStackRef,
    redoStackRef,
  });

  return { pushSnapshot, clearStacks };
}
