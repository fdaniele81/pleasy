import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, RotateCcw, Merge, Scissors } from 'lucide-react';
import SelectableCellsTable, { PHASES } from '../../estimator/components/SelectableCellsTable';
import Button from '../../../shared/ui/Button';
import BaseModal from '../../../shared/components/BaseModal';
import TaskNamePopup from './TaskNamePopup';
import TaskRowsTable from './TaskRowsTable';
import SplitModal from './SplitModal';

/**
 * Advanced mode panel: same toolbar as simple mode (merge/split/reset)
 * plus the SelectableCellsTable grid for custom cell-based task creation.
 */
function AdvancedModePanel({
  estimateDetails,
  selectedCells,
  onSelectedCellsChange,
  cellToTaskMap,
  taskRows,
  selectedRowIds,
  onToggleRow,
  onCreateTask,
  onMerge,
  onSplit,
  onTitleChange,
  onRemoveRow,
  onReset,
  onBack,
  originalTotal,
  currentTotal,
  budgetDifference,
  showInDays = false,
}) {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [autoTaskName, setAutoTaskName] = useState('');
  const [selectionBudget, setSelectionBudget] = useState(0);

  // Merge popup state
  const [showMergePopup, setShowMergePopup] = useState(false);
  const [mergeTitle, setMergeTitle] = useState('');
  const mergeTitleRef = useRef(null);

  // Split popup state
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [splitSourceRow, setSplitSourceRow] = useState(null);

  const selectedCount = selectedRowIds.size;
  const canMerge = selectedCount >= 2;
  const canSplit = selectedCount === 1;

  const formatValue = (hours) => {
    const num = parseFloat(hours) || 0;
    if (showInDays) {
      return (Math.round((num / 8) * 10) / 10).toString();
    }
    return (Math.round(num * 10) / 10).toString();
  };

  const unitLabel = showInDays ? 'gg' : 'h';

  // Compute available (non-assigned) cells from selection
  const availableCells = useMemo(() => {
    return Array.from(selectedCells).filter(key => !cellToTaskMap.has(key));
  }, [selectedCells, cellToTaskMap]);

  // Auto-detect selection type and compute name + budget
  useEffect(() => {
    if (!estimateDetails || availableCells.length === 0) {
      setAutoTaskName('');
      setSelectionBudget(0);
      return;
    }

    const cells = availableCells.map(key => {
      const [rowIndex, colIndex] = key.split('-').map(Number);
      return { rowIndex, colIndex, key };
    });

    const rows = new Set(cells.map(c => c.rowIndex));
    const cols = new Set(cells.map(c => c.colIndex));

    let name = '';
    if (rows.size === 1) {
      const rowIndex = Array.from(rows)[0];
      name = estimateDetails.tasks[rowIndex]?.activity_name || '';
    } else if (cols.size === 1) {
      const colIndex = Array.from(cols)[0];
      name = PHASES[colIndex]?.labelKey ? t('estimator:' + PHASES[colIndex].labelKey) : '';
    }
    setAutoTaskName(name);

    // Calculate budget
    const budget = cells.reduce((sum, cell) => {
      const task = estimateDetails.tasks[cell.rowIndex];
      const phase = PHASES[cell.colIndex];
      if (!task || !phase) return sum;

      if (cell.colIndex === 8) {
        const totalHours = PHASES.slice(0, 8).reduce((s, p) => {
          return s + (parseFloat(task[p.key]) || 0);
        }, 0);
        return sum + (totalHours * (estimateDetails.contingency_percentage || 0)) / 100;
      }

      return sum + (parseFloat(task[phase.key]) || 0);
    }, 0);

    setSelectionBudget(budget);
  }, [availableCells, estimateDetails, t]);

  useEffect(() => {
    if (showMergePopup) {
      setTimeout(() => mergeTitleRef.current?.focus(), 100);
    }
  }, [showMergePopup]);

  const getRowTitle = (row) => {
    if (row.title) return row.title;
    if (row.titleKey) return t('estimator:' + row.titleKey);
    return t('estimateConversion:untitledTask');
  };

  const handleCreate = () => {
    if (availableCells.length === 0) return;
    setIsPopupOpen(true);
  };

  const handleSaveTask = (title) => {
    onCreateTask(title, availableCells, selectionBudget);
  };

  const handleClearSelection = () => {
    onSelectedCellsChange(new Set());
  };

  // Merge
  const handleStartMerge = () => {
    const selected = taskRows.filter(r => selectedRowIds.has(r.id));
    const defaultName = selected.map(r => getRowTitle(r)).join(' + ');
    setMergeTitle(defaultName);
    setShowMergePopup(true);
  };

  const handleConfirmMerge = () => {
    if (!mergeTitle.trim()) return;
    onMerge(mergeTitle.trim());
    setShowMergePopup(false);
  };

  // Split
  const handleStartSplit = () => {
    const selectedId = Array.from(selectedRowIds)[0];
    const row = taskRows.find(r => r.id === selectedId);
    if (!row) return;
    setSplitSourceRow(row);
    setShowSplitPopup(true);
  };

  const handleConfirmSplit = (splitCount, splitBudgets) => {
    onSplit(splitCount, splitBudgets);
    setShowSplitPopup(false);
    setSplitSourceRow(null);
  };

  return (
    <div>
      {/* Cell grid */}
      {estimateDetails.tasks && estimateDetails.tasks.length > 0 && (
        <SelectableCellsTable
          estimateTasks={estimateDetails.tasks}
          contingencyPercentage={estimateDetails.contingency_percentage}
          selectedCells={selectedCells}
          cellToTaskMap={cellToTaskMap}
          onCellClick={onSelectedCellsChange}
          showInDays={showInDays}
        />
      )}

      {/* Selection bar */}
      {availableCells.length > 0 && (
        <div className="bg-white border-2 border-cyan-500 rounded-lg shadow-md p-4 mb-6 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-semibold">
                {availableCells.length} {availableCells.length === 1 ? t('estimator:cellSelected') : t('estimator:cellsSelected')}
              </div>
              <div className="text-sm text-gray-600">
                {t('estimator:budgetLabel')}{' '}
                <span className="font-bold text-cyan-700">
                  {formatValue(selectionBudget)}{unitLabel}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearSelection}>
                {t('common:cancel')}
              </Button>
              <Button color="cyan" icon={Save} onClick={handleCreate}>
                {t('estimateConversion:createTask')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar — below the cell grid, above the task list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mt-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {taskRows.length} {taskRows.length === 1 ? t('estimateConversion:taskRow') : t('estimateConversion:taskRows')}
            </span>
            {selectedCount > 0 && (
              <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-medium">
                {selectedCount} {t('estimateConversion:selected')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Merge}
              onClick={handleStartMerge}
              disabled={!canMerge}
              title={t('estimateConversion:mergeTooltip')}
            >
              {t('estimateConversion:merge')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Scissors}
              onClick={handleStartSplit}
              disabled={!canSplit}
              title={t('estimateConversion:splitTooltip')}
            >
              {t('estimateConversion:split')}
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={onBack}
            >
              {t('estimateConversion:backToSimple')}
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={onReset}
              title={t('estimateConversion:resetTooltip')}
              disabled={taskRows.length === 0}
            >
              {t('estimateConversion:reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Task rows table + budget validation */}
      {taskRows.length > 0 && (
        <div>
          <TaskRowsTable
            taskRows={taskRows}
            selectedRowIds={selectedRowIds}
            onToggleRow={onToggleRow}
            onTitleChange={onTitleChange}
            onRemoveRow={onRemoveRow}
            originalTotal={originalTotal}
            currentTotal={currentTotal}
            budgetDifference={budgetDifference}
            showInDays={showInDays}
            showCheckboxes
          />
        </div>
      )}

      {/* Task name popup (for cell-based creation) */}
      <TaskNamePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={handleSaveTask}
        autoTaskName={autoTaskName}
        totalBudget={selectionBudget}
        showInDays={showInDays}
      />

      {/* Merge popup */}
      <BaseModal
        isOpen={showMergePopup}
        onClose={() => setShowMergePopup(false)}
        title={t('estimateConversion:mergeTitle')}
        icon={<Merge className="text-cyan-600" size={24} />}
        size="md"
        customFooter={
          <>
            <Button onClick={() => setShowMergePopup(false)} variant="outline" color="gray">
              {t('common:cancel')}
            </Button>
            <Button onClick={handleConfirmMerge} color="cyan" disabled={!mergeTitle.trim()}>
              {t('estimateConversion:merge')}
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('estimateConversion:mergedTaskName')}
          </label>
          <input
            ref={mergeTitleRef}
            type="text"
            value={mergeTitle}
            onChange={(e) => setMergeTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mergeTitle.trim()) handleConfirmMerge();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            maxLength={255}
          />
        </div>
      </BaseModal>

      {/* Split popup */}
      <SplitModal
        isOpen={showSplitPopup}
        onClose={() => { setShowSplitPopup(false); setSplitSourceRow(null); }}
        onConfirm={handleConfirmSplit}
        sourceRow={splitSourceRow}
        showInDays={showInDays}
        getRowTitle={getRowTitle}
      />
    </div>
  );
}

export default AdvancedModePanel;
