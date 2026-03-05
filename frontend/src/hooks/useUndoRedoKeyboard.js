import { useEffect } from 'react';

/**
 * Shared keyboard listener for undo/redo (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z).
 * Handles input focus detection and preventDefault for Cmd+Y on Mac.
 */
export function useUndoRedoKeyboard({
  isEditingRef,
  cancelEditingRef,
  executeUndo,
  executeRedo,
  undoStackRef,
  redoStackRef,
}) {
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
  }, [executeUndo, executeRedo, isEditingRef, cancelEditingRef, undoStackRef, redoStackRef]);
}
