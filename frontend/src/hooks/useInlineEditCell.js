import { useState, useCallback, useRef } from 'react';
import { getKeyboardAction, preventNavigationDefault } from '../utils/keyboard/keyboardNavigation';
import logger from '../utils/logger';

export function useInlineEditCell({
  onSave,
  onNavigate = null,
  getCellKey = (rowId, columnKey) => `${rowId}-${columnKey}`,
  validateValue = null,
  parseValue = (val) => parseFloat(val) || 0,
  isNavigationAllowed = () => true,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isNavigatingWithTab, setIsNavigatingWithTab] = useState(false);

  const editingCellRef = useRef(null);
  const editValueRef = useRef('');
  const onClearCallbacksRef = useRef([]);

  const registerClearCallback = useCallback((callback) => {
    if (!onClearCallbacksRef.current.includes(callback)) {
      onClearCallbacksRef.current.push(callback);
    }
  }, []);

  const unregisterClearCallback = useCallback((callback) => {
    onClearCallbacksRef.current = onClearCallbacksRef.current.filter(cb => cb !== callback);
  }, []);

  const executeClearCallbacks = useCallback(() => {
    onClearCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Error executing clear callback:', error);
      }
    });
  }, []);

  const handleCellClick = useCallback((rowId, columnKey, currentValue, options = {}) => {
    if (options.isLocked) return;

    const cellKey = getCellKey(rowId, columnKey);
    editingCellRef.current = cellKey;
    editValueRef.current = currentValue || '';
    setEditingCell(cellKey);
    setEditingRowId(rowId);
    setEditValue(currentValue || '');
  }, [getCellKey]);

  const saveAndClose = useCallback(async (rowId, columnKey, previousValue, metadata = {}) => {
    const cellKey = getCellKey(rowId, columnKey);
    const currentEditValue = editValueRef.current;
    const parsedNewValue = parseValue(currentEditValue);
    const parsedPrevValue = parseValue(previousValue);

    if (parsedNewValue !== parsedPrevValue) {
      if (validateValue) {
        const validationResult = validateValue(parsedNewValue, rowId, columnKey);
        if (!validationResult.isValid) {
          if (editingCellRef.current === cellKey) {
            editingCellRef.current = null;
            editValueRef.current = '';
            setEditingCell(null);
            setEditingRowId(null);
            setEditValue('');
          }
          return;
        }
      }

      executeClearCallbacks();

      await onSave(rowId, columnKey, parsedNewValue, previousValue, metadata);
    }

    if (editingCellRef.current === cellKey) {
      editingCellRef.current = null;
      editValueRef.current = '';
      setEditingCell(null);
      setEditingRowId(null);
      setEditValue('');
    }
  }, [getCellKey, parseValue, validateValue, onSave, executeClearCallbacks]);

  const handleCellBlur = useCallback(async (rowId, columnKey, previousValue, metadata = {}) => {
    const cellKey = getCellKey(rowId, columnKey);

    if (editingCellRef.current !== cellKey) {
      return;
    }

    if (isNavigatingWithTab) {
      setIsNavigatingWithTab(false);
      return;
    }

    await saveAndClose(rowId, columnKey, previousValue, metadata);
  }, [getCellKey, isNavigatingWithTab, saveAndClose]);

  const handleKeyDown = useCallback(async (
    event,
    rowId,
    columnKey,
    previousValue,
    navigationConfig = {},
    metadata = {}
  ) => {
    const keyAction = getKeyboardAction(event);

    if (keyAction.action === 'none') {
      return;
    }

    preventNavigationDefault(event);

    if (keyAction.action === 'cancel') {
      executeClearCallbacks();
      editingCellRef.current = null;
      editValueRef.current = '';
      setEditingCell(null);
      setEditingRowId(null);
      setEditValue('');
      return;
    }

    if (keyAction.action === 'navigate') {
      const { direction, isTab } = keyAction;

      if (isTab) {
        setIsNavigatingWithTab(true);
      }

      await saveAndClose(rowId, columnKey, previousValue, metadata);

      if (navigationConfig.getNextCell && isNavigationAllowed()) {
        const nextCell = navigationConfig.getNextCell(direction, navigationConfig.currentIndex);

        if (nextCell) {
          if (onNavigate) {
            onNavigate({ rowId, columnKey }, direction);
          }

          const nextCellKey = getCellKey(nextCell.rowId, nextCell.columnKey);
          editingCellRef.current = nextCellKey;
          editValueRef.current = nextCell.currentValue || '';
          setEditingCell(nextCellKey);
          setEditingRowId(nextCell.rowId);
          setEditValue(nextCell.currentValue || '');
        }
      }
    }
  }, [
    saveAndClose,
    isNavigationAllowed,
    onNavigate,
    getCellKey,
    executeClearCallbacks,
  ]);

  const handleCellChange = useCallback((newValue) => {
    editValueRef.current = newValue;
    setEditValue(newValue);
  }, []);

  const isEditing = useCallback((rowId, columnKey) => {
    const cellKey = getCellKey(rowId, columnKey);
    return editingCell === cellKey;
  }, [editingCell, getCellKey]);

  const getEditValue = useCallback((rowId, columnKey, defaultValue = '') => {
    const cellKey = getCellKey(rowId, columnKey);
    return editingCell === cellKey ? editValue : defaultValue;
  }, [editingCell, editValue, getCellKey]);

  const cancelEditing = useCallback(() => {
    executeClearCallbacks();
    editingCellRef.current = null;
    editValueRef.current = '';
    setEditingCell(null);
    setEditingRowId(null);
    setEditValue('');
    setIsNavigatingWithTab(false);
  }, [executeClearCallbacks]);

  return {
    editingCell,
    editingRowId,
    editValue,

    handleCellClick,
    handleCellBlur,
    handleKeyDown,
    handleCellChange,

    isEditing,
    getEditValue,
    cancelEditing,
    registerClearCallback,
    unregisterClearCallback,
  };
}
