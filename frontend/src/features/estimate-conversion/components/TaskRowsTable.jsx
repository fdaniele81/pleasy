import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Check } from 'lucide-react';

/**
 * Shared table for displaying task rows with:
 * - Optional checkbox, color dot, editable title, read-only budget, remove button
 * - Footer with total and budget validation
 *
 * Used by both PhaseTaskList (simple mode) and AdvancedModePanel.
 */
function TaskRowsTable({
  taskRows,
  onTitleChange,
  onRemoveRow,
  originalTotal,
  currentTotal,
  budgetDifference,
  showInDays = false,
  // Optional checkbox support (simple mode only)
  showCheckboxes = false,
  selectedRowIds,
  onToggleRow,
}) {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common']);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef(null);

  const formatValue = (hours) => {
    const num = parseFloat(hours) || 0;
    if (showInDays) {
      return (Math.round((num / 8) * 10) / 10).toString();
    }
    return (Math.round(num * 10) / 10).toString();
  };

  const unitLabel = showInDays ? 'gg' : 'h';
  const budgetOk = Math.abs(budgetDifference) < 0.1;
  const colCount = showCheckboxes ? 4 : 3;

  useEffect(() => {
    if (editingTitle) {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  }, [editingTitle]);

  const getRowTitle = (row) => {
    if (row.title) return row.title;
    if (row.titleKey) return t('estimator:' + row.titleKey);
    return t('estimateConversion:untitledTask');
  };

  const handleTitleClick = (rowId, currentTitle) => {
    setEditingTitle(rowId);
    setEditValue(currentTitle);
  };

  const handleTitleBlur = () => {
    if (editingTitle) {
      onTitleChange(editingTitle, editValue.trim());
      setEditingTitle(null);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleBlur();
    if (e.key === 'Escape') setEditingTitle(null);
  };

  return (
    <>
      {/* Task rows table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {showCheckboxes && (
                <th className="w-10 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={taskRows.length > 0 && selectedRowIds?.size === taskRows.length}
                    ref={el => { if (el) el.indeterminate = selectedRowIds?.size > 0 && selectedRowIds.size < taskRows.length; }}
                    onChange={() => {
                      if (!onToggleRow) return;
                      const allSelected = selectedRowIds?.size === taskRows.length;
                      taskRows.forEach(row => {
                        const isSelected = selectedRowIds?.has(row.id);
                        if (allSelected ? isSelected : !isSelected) {
                          onToggleRow(row.id);
                        }
                      });
                    }}
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                  />
                </th>
              )}
              <th className="w-6 px-3 py-2"></th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('estimateConversion:taskName')}
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-28">
                {t('common:budget')} ({unitLabel})
              </th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {taskRows.map((row) => {
              const title = getRowTitle(row);
              const isSelected = showCheckboxes && selectedRowIds?.has(row.id);

              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-cyan-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  {showCheckboxes && (
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleRow(row.id)}
                        className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                    </td>
                  )}

                  {/* Color dot */}
                  <td className="px-3 py-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2">
                    {editingTitle === row.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="w-full px-2 py-1 border border-cyan-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        maxLength={255}
                      />
                    ) : (
                      <span
                        className="text-sm text-gray-900 cursor-pointer hover:text-cyan-700"
                        onClick={() => handleTitleClick(row.id, title)}
                        title={t('estimateConversion:clickToEditName')}
                      >
                        {title}
                      </span>
                    )}
                  </td>

                  {/* Budget (read-only) */}
                  <td className="px-3 py-2 text-right">
                    <span className="text-sm font-mono font-medium text-gray-800">
                      {formatValue(row.budget)}
                    </span>
                  </td>

                  {/* Remove */}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onRemoveRow(row.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title={t('estimator:removeTask')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td colSpan={colCount} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                {t('common:total')}
              </td>
              <td className="px-3 py-2 text-right">
                <span className={`text-sm font-mono font-bold ${budgetOk ? 'text-green-700' : 'text-red-600'}`}>
                  {formatValue(currentTotal)}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Budget validation */}
      <div className={`rounded-lg border-2 px-4 py-2 mb-4 flex items-center gap-2 ${
        budgetOk ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
      }`}>
        {budgetOk ? (
          <>
            <Check size={16} className="text-green-600" />
            <span className="text-sm text-green-700">
              {t('estimateConversion:budgetMatch', {
                total: formatValue(originalTotal),
                unit: unitLabel,
              })}
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm text-amber-700">
              {t('estimateConversion:budgetMismatch', {
                expected: formatValue(originalTotal),
                actual: formatValue(currentTotal),
                diff: formatValue(Math.abs(budgetDifference)),
                unit: unitLabel,
              })}
            </span>
          </>
        )}
      </div>
    </>
  );
}

export default TaskRowsTable;
