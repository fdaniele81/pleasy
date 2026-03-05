import { useState, useCallback, useMemo } from 'react';
import { PHASES } from '../../estimator/components/SelectableCellsTable';
import { calculatePhaseTotals, getPhaseKeysFromColumns } from '../utils/phaseMapping';

const TASK_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#6366F1', '#EF4444', '#84CC16',
];

let idCounter = 0;
function nextId() {
  return `task_${Date.now()}_${++idCounter}`;
}

/**
 * Core state management hook for the estimate-to-project conversion flow.
 * Manages task rows, selection, merge/split, and advanced mode cell tracking.
 */
export default function useConversionState() {
  const [mode, setMode] = useState('simple'); // 'simple' | 'advanced'
  const [taskRows, setTaskRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [originalTotalBudget, setOriginalTotalBudget] = useState(0);

  // Advanced mode state
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [cellToTaskMap, setCellToTaskMap] = useState(new Map());
  const [usedColors, setUsedColors] = useState([]);

  const getNextColor = useCallback(() => {
    const available = TASK_COLORS.filter(c => !usedColors.includes(c));
    return available.length > 0 ? available[0] : TASK_COLORS[usedColors.length % TASK_COLORS.length];
  }, [usedColors]);

  /**
   * Initialize task rows from an estimate's tasks and contingency.
   * Creates one row per E2E phase that has non-zero hours.
   */
  const initFromEstimate = useCallback((estimate, { keepMode = false } = {}) => {
    const phaseTotals = calculatePhaseTotals(estimate.tasks, estimate.contingency_percentage);

    const newCellToTaskMap = new Map();

    const rows = phaseTotals.map((phase, index) => {
      const id = nextId();
      const color = TASK_COLORS[index % TASK_COLORS.length];

      // Find column index for this phase in the grid
      const colIndex = PHASES.findIndex(p => p.key === phase.phaseKey);

      // Compute which cells (row-col) have non-zero values for this phase
      const cells = [];
      if (colIndex >= 0 && estimate.tasks) {
        estimate.tasks.forEach((task, rowIndex) => {
          let value = 0;
          if (phase.phaseKey === 'contingency') {
            // Contingency: calculated per task as (task total hours * contingency %)
            const taskTotal = PHASES.slice(0, 8).reduce((s, p) => s + (parseFloat(task[p.key]) || 0), 0);
            value = (taskTotal * (estimate.contingency_percentage || 0)) / 100;
          } else {
            value = parseFloat(task[phase.phaseKey]) || 0;
          }
          if (value > 0) {
            cells.push(`${rowIndex}-${colIndex}`);
          }
        });
      }

      // Register cells in the map
      cells.forEach(key => {
        newCellToTaskMap.set(key, { taskId: id, color });
      });

      return {
        id,
        title: '',
        titleKey: phase.labelKey,
        budget: phase.budget,
        phaseKeys: [phase.e2eKey],
        selectedCells: cells,
        color,
        source: 'auto',
      };
    });

    // Use sum of rounded phase budgets as original total (avoids rounding mismatch)
    const total = Math.round(rows.reduce((sum, r) => sum + r.budget, 0) * 10) / 10;

    setTaskRows(rows);
    setOriginalTotalBudget(total);
    setSelectedRowIds(new Set());
    setSelectedCells(new Set());
    setCellToTaskMap(newCellToTaskMap);
    setUsedColors(rows.map(r => r.color));
    if (!keepMode) setMode('simple');

    return rows;
  }, []);

  /**
   * Restore state from an existing draft (loaded from server).
   */
  const initFromDraft = useCallback((draftTasks, estimateTotalBudget) => {
    const rows = draftTasks.map((task, index) => ({
      id: task.task_details?.id || nextId(),
      title: task.title,
      titleKey: null,
      budget: parseFloat(task.budget) || 0,
      phaseKeys: task.task_details?.phase_keys || [],
      selectedCells: task.task_details?.selected_cells || [],
      color: task.task_details?.task_color || TASK_COLORS[index % TASK_COLORS.length],
      source: task.task_details?.source || 'auto',
    }));

    const newCellToTaskMap = new Map();
    rows.forEach(row => {
      if (row.selectedCells) {
        row.selectedCells.forEach(cellKey => {
          newCellToTaskMap.set(cellKey, { taskId: row.id, color: row.color });
        });
      }
    });

    setTaskRows(rows);
    setOriginalTotalBudget(estimateTotalBudget);
    setCellToTaskMap(newCellToTaskMap);
    setUsedColors(rows.map(r => r.color));
    setSelectedRowIds(new Set());
    setSelectedCells(new Set());
    setMode('simple');
  }, []);

  /**
   * Toggle row selection (for merge/split operations).
   */
  const toggleRowSelection = useCallback((rowId) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const clearRowSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  /**
   * Merge selected rows into one. Combined budget, union of phaseKeys.
   * Returns the new task rows array for immediate use.
   */
  const mergeRows = useCallback((newTitle) => {
    let newRows = null;
    setTaskRows(prev => {
      const toMerge = prev.filter(r => selectedRowIds.has(r.id));
      const rest = prev.filter(r => !selectedRowIds.has(r.id));

      if (toMerge.length < 2) return prev;

      const mergedBudget = toMerge.reduce((sum, r) => sum + r.budget, 0);
      const mergedPhaseKeys = [...new Set(toMerge.flatMap(r => r.phaseKeys))];
      const mergedCells = [...new Set(toMerge.flatMap(r => r.selectedCells || []))];
      const color = toMerge[0].color;

      const merged = {
        id: nextId(),
        title: newTitle,
        titleKey: null,
        budget: Math.round(mergedBudget * 10) / 10,
        phaseKeys: mergedPhaseKeys,
        selectedCells: mergedCells,
        color,
        source: 'auto',
      };

      // Update cellToTaskMap for merged cells
      setCellToTaskMap(prevMap => {
        const newMap = new Map(prevMap);
        toMerge.forEach(row => {
          (row.selectedCells || []).forEach(key => newMap.delete(key));
        });
        mergedCells.forEach(key => {
          newMap.set(key, { taskId: merged.id, color: merged.color });
        });
        return newMap;
      });

      const removedColors = toMerge.slice(1).map(r => r.color);
      setUsedColors(prev => prev.filter(c => !removedColors.includes(c)));

      const firstMergedIndex = prev.findIndex(r => selectedRowIds.has(r.id));
      const result = [...rest];
      result.splice(Math.min(firstMergedIndex, result.length), 0, merged);

      newRows = result;
      return result;
    });
    setSelectedRowIds(new Set());
    return newRows;
  }, [selectedRowIds]);

  /**
   * Split a selected row into N parts with given budgets.
   * Returns the new task rows array for immediate use.
   */
  const splitRow = useCallback((splitCount, budgets) => {
    const selectedId = Array.from(selectedRowIds)[0];
    if (!selectedId) return null;

    let newRows = null;
    setTaskRows(prev => {
      const index = prev.findIndex(r => r.id === selectedId);
      if (index < 0) return prev;

      const row = prev[index];
      const origCells = row.selectedCells || [];

      const newParts = [];
      const partIds = [];
      for (let i = 0; i < splitCount; i++) {
        const partId = nextId();
        partIds.push(partId);
        newParts.push({
          ...row,
          id: partId,
          title: row.title ? `${row.title} (${i + 1})` : '',
          titleKey: row.titleKey,
          budget: Math.round((budgets[i] || 0) * 10) / 10,
          selectedCells: [...origCells], // all parts share the same cells
        });
      }

      // Update cellToTaskMap: first part is primary owner
      setCellToTaskMap(prevMap => {
        const newMap = new Map(prevMap);
        origCells.forEach(key => {
          newMap.set(key, { taskId: partIds[0], color: row.color });
        });
        return newMap;
      });

      const result = [...prev];
      result.splice(index, 1, ...newParts);
      newRows = result;
      return result;
    });
    setSelectedRowIds(new Set());
    return newRows;
  }, [selectedRowIds]);

  /**
   * Update a row's budget.
   */
  const updateRowBudget = useCallback((rowId, newBudget) => {
    setTaskRows(prev => prev.map(r =>
      r.id === rowId ? { ...r, budget: parseFloat(newBudget) || 0 } : r
    ));
  }, []);

  /**
   * Update a row's title.
   */
  const updateRowTitle = useCallback((rowId, newTitle) => {
    let newRows = null;
    setTaskRows(prev => {
      newRows = prev.map(r =>
        r.id === rowId ? { ...r, title: newTitle, titleKey: null } : r
      );
      return newRows;
    });
    return newRows;
  }, []);

  /**
   * Remove a row. Returns the new task rows array.
   */
  const removeRow = useCallback((rowId) => {
    let newRows = null;
    setTaskRows(prev => {
      const row = prev.find(r => r.id === rowId);
      if (!row) return prev;

      const remaining = prev.filter(r => r.id !== rowId);

      // Check if another row shares the same cells (e.g. split sibling)
      const cellsToRemove = row.selectedCells || [];
      const siblingWithSameCells = remaining.find(r =>
        r.selectedCells && r.selectedCells.length > 0 &&
        cellsToRemove.some(key => r.selectedCells.includes(key))
      );

      setCellToTaskMap(prevMap => {
        const newMap = new Map(prevMap);
        cellsToRemove.forEach(key => {
          if (siblingWithSameCells) {
            // Transfer ownership to the sibling
            newMap.set(key, { taskId: siblingWithSameCells.id, color: siblingWithSameCells.color });
          } else {
            newMap.delete(key);
          }
        });
        return newMap;
      });

      // Only free the color if no remaining row uses it
      const colorStillUsed = remaining.some(r => r.color === row.color);
      if (!colorStillUsed) {
        setUsedColors(prevColors => prevColors.filter(c => c !== row.color));
      }

      setSelectedRowIds(prevIds => {
        const next = new Set(prevIds);
        next.delete(rowId);
        return next;
      });

      newRows = remaining;
      return newRows;
    });
    return newRows;
  }, []);

  /**
   * Create a task row from cells selected in advanced mode.
   * Returns { newTask, newRows } for immediate use.
   */
  const createTaskFromCells = useCallback((title, cells, budget) => {
    const color = getNextColor();

    const colIndices = new Set(cells.map(key => {
      const parts = key.split('-');
      return parseInt(parts[1], 10);
    }));
    const phaseKeys = getPhaseKeysFromColumns(Array.from(colIndices));

    const newTask = {
      id: nextId(),
      title,
      titleKey: null,
      budget: Math.round(budget * 10) / 10,
      phaseKeys,
      selectedCells: cells,
      color,
      source: 'advanced',
    };

    let newRows = null;
    setTaskRows(prev => {
      newRows = [...prev, newTask];
      return newRows;
    });

    setCellToTaskMap(prev => {
      const newMap = new Map(prev);
      cells.forEach(key => {
        newMap.set(key, { taskId: newTask.id, color });
      });
      return newMap;
    });

    setUsedColors(prev => [...prev, color]);
    setSelectedCells(new Set());

    return newRows;
  }, [getNextColor]);

  /**
   * Clear cell selection (advanced mode).
   */
  const clearCellSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  /**
   * Reset all task rows (clear everything).
   */
  const resetRows = useCallback(() => {
    setTaskRows([]);
    setSelectedRowIds(new Set());
    setSelectedCells(new Set());
    setCellToTaskMap(new Map());
    setUsedColors([]);
    return [];
  }, []);

  /**
   * Budget difference: sum of rows vs original total
   */
  const budgetDifference = useMemo(() => {
    const currentTotal = taskRows.reduce((sum, r) => sum + r.budget, 0);
    return Math.round((currentTotal - originalTotalBudget) * 10) / 10;
  }, [taskRows, originalTotalBudget]);

  const currentTotalBudget = useMemo(() => {
    return Math.round(taskRows.reduce((sum, r) => sum + r.budget, 0) * 10) / 10;
  }, [taskRows]);

  return {
    // State
    mode,
    setMode,
    taskRows,
    selectedRowIds,
    originalTotalBudget,
    selectedCells,
    setSelectedCells,
    cellToTaskMap,
    budgetDifference,
    currentTotalBudget,

    // Actions
    initFromEstimate,
    initFromDraft,
    toggleRowSelection,
    clearRowSelection,
    mergeRows,
    splitRow,
    updateRowBudget,
    updateRowTitle,
    removeRow,
    createTaskFromCells,
    clearCellSelection,
    resetRows,
  };
}
