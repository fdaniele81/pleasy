import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Merge, Scissors, Settings2, RotateCcw, Minus, Plus, AlertTriangle, Check } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import BaseModal from '../../../shared/components/BaseModal';
import TaskRowsTable from './TaskRowsTable';

/**
 * Simple mode view: toolbar (merge/split/advanced/reset) + shared task rows table.
 */
function PhaseTaskList({
  taskRows,
  selectedRowIds,
  onToggleRow,
  onMerge,
  onSplit,
  onTitleChange,
  onRemoveRow,
  onReset,
  onSwitchToAdvanced,
  originalTotal,
  currentTotal,
  budgetDifference,
  showInDays = false,
}) {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common']);
  const [showMergePopup, setShowMergePopup] = useState(false);
  const [mergeTitle, setMergeTitle] = useState('');
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splitBudgets, setSplitBudgets] = useState([]);
  const [splitSourceRow, setSplitSourceRow] = useState(null);
  const mergeTitleRef = useRef(null);

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

  useEffect(() => {
    if (showMergePopup) {
      setTimeout(() => mergeTitleRef.current?.focus(), 100);
    }
  }, [showMergePopup]);

  // Recalculate split budgets when splitCount changes
  useEffect(() => {
    if (splitSourceRow && splitCount >= 2) {
      const total = splitSourceRow.budget;
      const each = Math.round((total / splitCount) * 10) / 10;
      const budgets = Array(splitCount).fill(each);
      // Adjust last to absorb rounding
      const sumOthers = budgets.slice(0, -1).reduce((s, v) => s + v, 0);
      budgets[budgets.length - 1] = Math.round((total - sumOthers) * 10) / 10;
      setSplitBudgets(budgets);
    }
  }, [splitCount, splitSourceRow]);

  const getRowTitle = (row) => {
    if (row.title) return row.title;
    if (row.titleKey) return t('estimator:' + row.titleKey);
    return t('estimateConversion:untitledTask');
  };

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

  const handleStartSplit = () => {
    const selectedId = Array.from(selectedRowIds)[0];
    const row = taskRows.find(r => r.id === selectedId);
    if (!row) return;
    setSplitSourceRow(row);
    setSplitCount(2);
    setShowSplitPopup(true);
  };

  const handleSplitBudgetChange = (index, value) => {
    const newBudgets = [...splitBudgets];
    newBudgets[index] = parseFloat(value) || 0;
    setSplitBudgets(newBudgets);
  };

  const handleConfirmSplit = () => {
    if (!splitSourceRow || splitBudgets.length < 2) return;
    onSplit(splitCount, splitBudgets);
    setShowSplitPopup(false);
    setSplitSourceRow(null);
  };

  const splitBudgetSum = splitBudgets.reduce((s, v) => s + v, 0);
  const splitBudgetOk = splitSourceRow ? Math.abs(splitBudgetSum - splitSourceRow.budget) < 0.1 : false;

  return (
    <>
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-4">
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
              icon={Settings2}
              onClick={onSwitchToAdvanced}
            >
              {t('estimateConversion:advancedMode')}
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

      {/* Shared task rows table + budget validation */}
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
      <BaseModal
        isOpen={showSplitPopup}
        onClose={() => { setShowSplitPopup(false); setSplitSourceRow(null); }}
        title={t('estimateConversion:splitTitle')}
        icon={<Scissors className="text-cyan-600" size={24} />}
        size="md"
        customFooter={
          <>
            <Button onClick={() => { setShowSplitPopup(false); setSplitSourceRow(null); }} variant="outline" color="gray">
              {t('common:cancel')}
            </Button>
            <Button onClick={handleConfirmSplit} color="cyan" disabled={!splitBudgetOk}>
              {t('estimateConversion:split')}
            </Button>
          </>
        }
      >
        {splitSourceRow && (
          <div className="space-y-4">
            {/* Source info */}
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: splitSourceRow.color }}
              />
              <span className="text-sm font-medium text-gray-800">
                {getRowTitle(splitSourceRow)}
              </span>
              <span className="text-sm font-mono text-gray-600 ml-auto">
                {formatValue(splitSourceRow.budget)}{unitLabel}
              </span>
            </div>

            {/* Split count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimateConversion:splitCountLabel')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                  disabled={splitCount <= 2}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="text-lg font-semibold text-gray-800 w-8 text-center">{splitCount}</span>
                <button
                  onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                  disabled={splitCount >= 10}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Budget distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimateConversion:splitBudgetLabel')}
              </label>
              <div className="space-y-2">
                {splitBudgets.map((budget, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6 text-right">{index + 1}.</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => handleSplitBudgetChange(index, e.target.value)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      step="0.1"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">{unitLabel}</span>
                  </div>
                ))}
              </div>

              {/* Sum validation */}
              <div className={`mt-3 text-xs flex items-center gap-1 ${splitBudgetOk ? 'text-green-600' : 'text-amber-600'}`}>
                {splitBudgetOk ? (
                  <Check size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                <span>
                  {t('common:total')}: {formatValue(splitBudgetSum)}{unitLabel} / {formatValue(splitSourceRow.budget)}{unitLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </>
  );
}

export default PhaseTaskList;
