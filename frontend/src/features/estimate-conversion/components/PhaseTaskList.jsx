import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Merge, Scissors, Settings2, RotateCcw } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import BaseModal from '../../../shared/components/BaseModal';
import TaskRowsTable from './TaskRowsTable';
import SplitModal from './SplitModal';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

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
  const { isMobile } = useBreakpoint();
  const [showMergePopup, setShowMergePopup] = useState(false);
  const [mergeTitle, setMergeTitle] = useState('');
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [splitSourceRow, setSplitSourceRow] = useState(null);
  const mergeTitleRef = useRef(null);

  const selectedCount = selectedRowIds.size;
  const canMerge = selectedCount >= 2;
  const canSplit = selectedCount === 1;

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
    setShowSplitPopup(true);
  };

  const handleConfirmSplit = (splitCount, splitBudgets) => {
    onSplit(splitCount, splitBudgets);
    setShowSplitPopup(false);
    setSplitSourceRow(null);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 lg:px-4 py-2 lg:py-3 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <span className="text-xs lg:text-sm text-gray-600 shrink-0">
              {taskRows.length} {taskRows.length === 1 ? t('estimateConversion:taskRow') : t('estimateConversion:taskRows')}
            </span>
            {selectedCount > 0 && (
              <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-medium shrink-0">
                {selectedCount} {t('estimateConversion:selected')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={Merge}
              onClick={handleStartMerge}
              disabled={!canMerge}
              title={t('estimateConversion:mergeTooltip')}
            >
              {!isMobile && t('estimateConversion:merge')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Scissors}
              onClick={handleStartSplit}
              disabled={!canSplit}
              title={t('estimateConversion:splitTooltip')}
            >
              {!isMobile && t('estimateConversion:split')}
            </Button>
            {!isMobile && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  icon={Settings2}
                  onClick={onSwitchToAdvanced}
                  title={t('estimateConversion:advancedMode')}
                >
                  {t('estimateConversion:advancedMode')}
                </Button>
              </>
            )}
            <div className="w-px h-6 bg-gray-300 mx-0.5 lg:mx-1" />
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={onReset}
              title={t('estimateConversion:resetTooltip')}
              disabled={taskRows.length === 0}
            >
              {!isMobile && t('estimateConversion:reset')}
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
      <SplitModal
        isOpen={showSplitPopup}
        onClose={() => { setShowSplitPopup(false); setSplitSourceRow(null); }}
        onConfirm={handleConfirmSplit}
        sourceRow={splitSourceRow}
        showInDays={showInDays}
        getRowTitle={getRowTitle}
      />
    </>
  );
}

export default PhaseTaskList;
