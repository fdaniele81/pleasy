import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Scissors, Minus, Plus, AlertTriangle, Check, Scale } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import BaseModal from '../../../shared/components/BaseModal';

// Colors for bar segments
const SEGMENT_COLORS = [
  '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
  '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe', '#ecfeff',
];

/**
 * Shared split modal with:
 * - Draggable visual bar to adjust proportions
 * - Percentage + hours inputs (bidirectional, free editing)
 * - "Normalize to 100%" button to proportionally scale all values
 */
function SplitModal({
  isOpen,
  onClose,
  onConfirm,
  sourceRow,
  showInDays = false,
  getRowTitle,
}) {
  const { t } = useTranslation(['estimateConversion', 'common']);

  const [splitCount, setSplitCount] = useState(2);
  const [splitBudgets, setSplitBudgets] = useState([]);

  // Drag state
  const barRef = useRef(null);
  const dragRef = useRef(null);

  const totalBudget = sourceRow?.budget || 0;

  const formatValue = (hours) => {
    const num = parseFloat(hours) || 0;
    if (showInDays) {
      return (Math.round((num / 8) * 10) / 10).toString();
    }
    return (Math.round(num * 10) / 10).toString();
  };

  const parseInputValue = (val) => {
    const num = parseFloat(val) || 0;
    return showInDays ? num * 8 : num;
  };

  const displayValue = (hours) => {
    const num = parseFloat(hours) || 0;
    return showInDays ? Math.round((num / 8) * 10) / 10 : Math.round(num * 10) / 10;
  };

  const unitLabel = showInDays ? 'gg' : 'h';

  const distributeEqual = useCallback((count, total) => {
    const each = Math.round((total / count) * 10) / 10;
    const budgets = Array(count).fill(each);
    const sumOthers = budgets.slice(0, -1).reduce((s, v) => s + v, 0);
    budgets[budgets.length - 1] = Math.round((total - sumOthers) * 10) / 10;
    return budgets;
  }, []);

  // Recalculate when splitCount changes
  useEffect(() => {
    if (sourceRow && splitCount >= 2) {
      setSplitBudgets(distributeEqual(splitCount, totalBudget));
    }
  }, [splitCount, sourceRow, totalBudget, distributeEqual]);

  // Reset when opening
  useEffect(() => {
    if (isOpen && sourceRow) {
      setSplitCount(2);
      setSplitBudgets(distributeEqual(2, sourceRow.budget));
    }
  }, [isOpen, sourceRow, distributeEqual]);

  const splitBudgetSum = splitBudgets.reduce((s, v) => s + v, 0);
  const splitBudgetOk = sourceRow ? Math.abs(splitBudgetSum - totalBudget) < 0.1 : false;

  // Percentage relative to the current sum (for bar rendering)
  const getBarPercent = (budget) => {
    const base = Math.max(splitBudgetSum, totalBudget);
    if (!base) return 0;
    return Math.round((budget / base) * 1000) / 10;
  };

  // Percentage relative to totalBudget (for input display)
  const getPercent = (budget) => {
    if (!totalBudget) return 0;
    return Math.round((budget / totalBudget) * 1000) / 10;
  };

  const totalPercent = Math.round((splitBudgetSum / totalBudget) * 1000) / 10;

  // --- Simple input handlers (no redistribution) ---

  const handleBudgetChange = (index, value) => {
    const newBudgets = [...splitBudgets];
    newBudgets[index] = Math.max(0, parseInputValue(value));
    setSplitBudgets(newBudgets);
  };

  const handlePercentChange = (index, pctStr) => {
    const pct = Math.max(0, parseFloat(pctStr) || 0);
    const newBudgets = [...splitBudgets];
    newBudgets[index] = Math.round((totalBudget * pct / 100) * 10) / 10;
    setSplitBudgets(newBudgets);
  };

  // --- Normalize: scale all values proportionally to hit totalBudget ---

  const handleNormalize = () => {
    if (splitBudgetSum <= 0) {
      setSplitBudgets(distributeEqual(splitCount, totalBudget));
      return;
    }
    const factor = totalBudget / splitBudgetSum;
    const newBudgets = splitBudgets.map(b => Math.round((b * factor) * 10) / 10);
    // Adjust last to absorb rounding
    const sumOthers = newBudgets.slice(0, -1).reduce((s, v) => s + v, 0);
    newBudgets[newBudgets.length - 1] = Math.round((totalBudget - sumOthers) * 10) / 10;
    setSplitBudgets(newBudgets);
  };

  // --- Draggable bar ---

  const handleDividerMouseDown = useCallback((e, dividerIndex) => {
    e.preventDefault();
    dragRef.current = {
      dividerIndex,
      startX: e.clientX,
      startBudgets: [...splitBudgets],
    };

    const handleMouseMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag || !barRef.current) return;

      const barRect = barRef.current.getBoundingClientRect();
      const barWidth = barRect.width;
      if (barWidth <= 0) return;

      const deltaX = moveEvent.clientX - drag.startX;
      const barTotal = Math.max(drag.startBudgets.reduce((s, v) => s + v, 0), totalBudget);
      const deltaBudget = (barTotal * deltaX) / barWidth;

      const leftIdx = drag.dividerIndex;
      const rightIdx = drag.dividerIndex + 1;
      const leftOriginal = drag.startBudgets[leftIdx];
      const rightOriginal = drag.startBudgets[rightIdx];
      const combined = leftOriginal + rightOriginal;

      const minBudget = 0.1;
      let newLeft = Math.round((leftOriginal + deltaBudget) * 10) / 10;
      newLeft = Math.max(minBudget, Math.min(combined - minBudget, newLeft));
      const newRight = Math.round((combined - newLeft) * 10) / 10;

      const newBudgets = [...drag.startBudgets];
      newBudgets[leftIdx] = newLeft;
      newBudgets[rightIdx] = newRight;
      setSplitBudgets(newBudgets);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitBudgets, totalBudget]);

  // Assign the missing gap to a specific row
  const handleFillGap = (index) => {
    const gap = totalBudget - splitBudgetSum;
    const newBudgets = [...splitBudgets];
    newBudgets[index] = Math.round((newBudgets[index] + gap) * 10) / 10;
    setSplitBudgets(newBudgets);
  };

  const deficit = Math.round((totalBudget - splitBudgetSum) * 10) / 10;
  const hasDeficit = deficit > 0.05;

  const handleConfirm = () => {
    if (!sourceRow || splitBudgets.length < 2 || !splitBudgetOk) return;
    onConfirm(splitCount, splitBudgets);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('estimateConversion:splitTitle')}
      icon={<Scissors className="text-cyan-600" size={24} />}
      size="md"
      customFooter={
        <>
          <Button onClick={onClose} variant="outline" color="gray">
            {t('common:cancel')}
          </Button>
          <Button onClick={handleConfirm} color="cyan" disabled={!splitBudgetOk}>
            {t('estimateConversion:split')}
          </Button>
        </>
      }
    >
      {sourceRow && (
        <div className="space-y-4">
          {/* Source info */}
          <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: sourceRow.color }}
            />
            <span className="text-sm font-medium text-gray-800">
              {getRowTitle(sourceRow)}
            </span>
            <span className="text-sm font-mono text-gray-600 ml-auto">
              {formatValue(sourceRow.budget)}{unitLabel}
            </span>
          </div>

          {/* Split count */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
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

          {/* Draggable distribution bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">
                {t('estimateConversion:splitDistribution')}
              </label>
              {/* Normalize button */}
              {!splitBudgetOk && (
                <button
                  onClick={handleNormalize}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                  title={t('estimateConversion:splitNormalizeTooltip')}
                >
                  <Scale size={12} />
                  {t('estimateConversion:splitNormalize')}
                </button>
              )}
            </div>
            <div
              ref={barRef}
              className="relative flex h-9 rounded-md overflow-visible border border-gray-200 select-none"
            >
              {splitBudgets.map((budget, index) => {
                const pct = getBarPercent(budget);
                return (
                  <React.Fragment key={index}>
                    <div
                      className="flex items-center justify-center text-[10px] font-semibold text-white transition-colors duration-100 overflow-hidden"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                        borderRadius: index === 0 ? '5px 0 0 5px' : index === splitBudgets.length - 1 ? '0 5px 5px 0' : '0',
                      }}
                      title={`${index + 1}: ${formatValue(budget)}${unitLabel} (${getPercent(budget)}%)`}
                    >
                      {pct >= 12 ? `${getPercent(budget)}%` : ''}
                    </div>
                    {index < splitBudgets.length - 1 && (
                      <div
                        className="absolute top-0 h-full w-4 z-10 cursor-col-resize flex items-center justify-center group"
                        style={{
                          left: `calc(${splitBudgets.slice(0, index + 1).reduce((s, b) => s + getBarPercent(b), 0)}% - 8px)`,
                        }}
                        onMouseDown={(e) => handleDividerMouseDown(e, index)}
                      >
                        <div className="w-1 h-5 rounded-full bg-white/70 group-hover:bg-white group-hover:shadow-md transition-all" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {t('estimateConversion:splitDragHint')}
            </p>
          </div>

          {/* Budget distribution rows */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('estimateConversion:splitBudgetLabel')}
            </label>
            <div className="space-y-2">
              {splitBudgets.map((budget, index) => {
                const pct = getPercent(budget);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-500 w-4 text-right">{index + 1}.</span>
                    <div className="relative">
                      <input
                        type="number"
                        value={pct}
                        onChange={(e) => handlePercentChange(index, e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right pr-6 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        step="1"
                        min="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                    <input
                      type="number"
                      value={displayValue(budget)}
                      onChange={(e) => handleBudgetChange(index, e.target.value)}
                      className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      step="0.1"
                      min="0"
                    />
                    <span className="text-xs text-gray-500 w-4">{unitLabel}</span>
                    {/* Fill gap button: only when under 100% */}
                    {hasDeficit ? (
                      <button
                        onClick={() => handleFillGap(index)}
                        className="ml-1 px-1.5 py-0.5 text-[11px] font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded hover:bg-cyan-100 transition-colors whitespace-nowrap"
                        title={t('estimateConversion:splitFillGapTooltip')}
                      >
                        +{formatValue(deficit)}{unitLabel}
                      </button>
                    ) : (
                      <span className="ml-1 w-16" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sum validation */}
            <div className="mt-3">
              <div className={`text-xs flex items-center gap-1 ${splitBudgetOk ? 'text-green-600' : 'text-amber-600'}`}>
                {splitBudgetOk ? (
                  <Check size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                <span>
                  {t('common:total')}: {formatValue(splitBudgetSum)}{unitLabel} / {formatValue(totalBudget)}{unitLabel}
                  {!splitBudgetOk && ` (${totalPercent}%)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default SplitModal;
