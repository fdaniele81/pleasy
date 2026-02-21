import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const PHASES = [
  { key: 'hours_analysis', labelKey: 'phaseAnalysis' },
  { key: 'hours_development', labelKey: 'phaseDevelopment' },
  { key: 'hours_internal_test', labelKey: 'phaseInternalTest' },
  { key: 'hours_uat', labelKey: 'phaseUAT' },
  { key: 'hours_release', labelKey: 'phaseRelease' },
  { key: 'hours_pm', labelKey: 'phasePM' },
  { key: 'hours_startup', labelKey: 'phaseStartup' },
  { key: 'hours_documentation', labelKey: 'phaseDocumentation' },
  { key: 'contingency', labelKey: 'phaseContingency' }
];

function SelectableCellsTable({
  estimateTasks,
  contingencyPercentage,
  selectedCells,
  cellToTaskMap = new Map(),
  onCellClick
}) {
  const { t } = useTranslation(['estimator', 'common']);
  const formatHours = (hours) => {
    const num = parseFloat(hours);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  };

  const calculateTotalHours = (task) => {
    return PHASES.slice(0, 8).reduce((sum, phase) => {
      return sum + (parseFloat(task[phase.key]) || 0);
    }, 0);
  };

  const getTaskContingency = (task) => {
    const totalHours = calculateTotalHours(task);
    return calculateContingencyHours(totalHours);
  };

  const calculateContingencyHours = (totalHours) => {
    return (totalHours * contingencyPercentage) / 100;
  };

  const isCellAssigned = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    return cellToTaskMap.has(cellKey);
  };

  const handleCellClick = (rowIndex, colIndex, event) => {
    event.stopPropagation();
    const cellKey = `${rowIndex}-${colIndex}`;

    if (isCellAssigned(rowIndex, colIndex)) {
      return;
    }

    const newSet = new Set(selectedCells);
    if (newSet.has(cellKey)) {
      newSet.delete(cellKey);
    } else {
      newSet.add(cellKey);
    }
    onCellClick(newSet);
  };

  const handleRowClick = (rowIndex, event) => {
    event.stopPropagation();
    const newSet = new Set(selectedCells);

    const rowCellsAvailable = [];
    for (let colIndex = 0; colIndex < 8; colIndex++) {
      const cellKey = `${rowIndex}-${colIndex}`;
      if (!isCellAssigned(rowIndex, colIndex)) {
        rowCellsAvailable.push(cellKey);
      }
    }

    if (rowCellsAvailable.length === 0) {
      return;
    }

    const allSelected = rowCellsAvailable.every(cellKey => newSet.has(cellKey));

    if (allSelected) {
      rowCellsAvailable.forEach(cellKey => newSet.delete(cellKey));
    } else {
      rowCellsAvailable.forEach(cellKey => newSet.add(cellKey));
    }

    onCellClick(newSet);
  };

  const handleColumnClick = (colIndex, event) => {
    event.stopPropagation();
    const newSet = new Set(selectedCells);

    const columnCellsAvailable = [];
    estimateTasks.forEach((_, rowIndex) => {
      const cellKey = `${rowIndex}-${colIndex}`;
      if (!isCellAssigned(rowIndex, colIndex)) {
        columnCellsAvailable.push(cellKey);
      }
    });

    if (columnCellsAvailable.length === 0) {
      return;
    }

    const allSelected = columnCellsAvailable.every(cellKey => newSet.has(cellKey));

    if (allSelected) {
      columnCellsAvailable.forEach(cellKey => newSet.delete(cellKey));
    } else {
      columnCellsAvailable.forEach(cellKey => newSet.add(cellKey));
    }

    onCellClick(newSet);
  };

  const isCellSelected = (rowIndex, colIndex) => {
    return selectedCells.has(`${rowIndex}-${colIndex}`);
  };

  const columnTotals = useMemo(() => PHASES.map((phase, colIndex) => {
    if (colIndex === 8) {
      return estimateTasks.reduce((sum, task) => {
        return sum + getTaskContingency(task);
      }, 0);
    }
    return estimateTasks.reduce((sum, task) => {
      return sum + (parseFloat(task[phase.key]) || 0);
    }, 0);
  }), [estimateTasks, contingencyPercentage]);

  const grandTotal = useMemo(() => columnTotals.slice(0, 8).reduce((sum, total) => sum + total, 0), [columnTotals]);
  const grandTotalWithContingency = useMemo(() => columnTotals.reduce((sum, total) => sum + total, 0), [columnTotals]);

  const phasePercentages = useMemo(() => PHASES.slice(0, 8).map((_, idx) => {
    const total = columnTotals[idx];
    if (grandTotal === 0) return 0;
    return (total / grandTotal) * 100;
  }), [columnTotals, grandTotal]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">


      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            <col className="w-[24%] lg:w-[26%]" />
            <col className="w-[22%] lg:w-[24%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[5%] lg:w-[4.5%]" />
            <col className="w-[9%] lg:w-[9.5%]" />
          </colgroup>
          <thead className="bg-cyan-700 border-b border-cyan-800">
            <tr>
              <th className="px-0.5 lg:px-3 py-2 text-left text-xs lg:text-sm font-semibold text-white align-bottom border border-cyan-600">
                {t('estimator:tableEstimate')}
              </th>
              <th className="px-0.5 lg:px-3 py-2 text-left text-xs lg:text-sm font-semibold text-white align-bottom border border-cyan-600">
                {t('estimator:itemDetailPlaceholder')}
              </th>
              {PHASES.slice(0, 8).map((phase, idx) => (
                <th
                  key={phase.key}
                  onClick={(e) => handleColumnClick(idx, e)}
                  className="px-0 lg:px-1 text-center align-bottom cursor-pointer hover:bg-cyan-600 transition-colors border border-cyan-600"
                  style={{ height: '140px' }}
                  title={t('estimator:selectColumnTitle', { column: t('estimator:' + phase.labelKey) })}
                >
                  <div className="flex flex-col items-center justify-end h-full pb-2">
                    <div
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                      className="text-xs lg:text-sm font-semibold text-white mb-2"
                    >
                      {t('estimator:' + phase.labelKey)}
                    </div>
                    <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
                      {phasePercentages[idx].toFixed(1)}%
                    </div>
                  </div>
                </th>
              ))}
              <th
                onClick={(e) => handleColumnClick(8, e)}
                className="px-0 lg:px-1 text-center align-bottom cursor-pointer hover:bg-cyan-600 transition-colors border border-cyan-600"
                style={{ height: '140px' }}
                title={t('estimator:selectColumnTitle', { column: t('estimator:phaseContingency') })}
              >
                <div className="flex flex-col items-center justify-end h-full pb-2">
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                    }}
                    className="text-xs lg:text-sm font-semibold text-white mb-2"
                  >
                    {t('estimator:phaseContingency')}
                  </div>
                  <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
                    {parseFloat(contingencyPercentage).toFixed(1)}%
                  </div>
                </div>
              </th>
              <th
                className="px-0 lg:px-1 text-center align-bottom border border-cyan-600"
                style={{ height: '140px' }}
              >
                <div className="flex flex-col items-center justify-end h-full pb-2">
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                    }}
                    className="text-xs lg:text-sm font-semibold text-white mb-2"
                  >
                    {t('common:total')}
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {estimateTasks.map((task, rowIndex) => {
              const totalHours = calculateTotalHours(task);
              const totalWithContingency = totalHours + calculateContingencyHours(totalHours);

              return (
                <tr key={task.estimate_task_id || rowIndex} className="hover:bg-gray-50">
                  <td
                    onClick={(e) => handleRowClick(rowIndex, e)}
                    className="px-0.5 lg:px-3 py-1.5 text-xs lg:text-sm text-gray-900 font-medium cursor-pointer hover:bg-cyan-100 transition-colors truncate border border-gray-200"
                    title={t('estimator:selectRowTitle', { row: task.activity_name })}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-[10px]">▶</span>
                      <span className="truncate">{task.activity_name}</span>
                    </div>
                  </td>

                  <td className="px-0.5 lg:px-3 py-1.5 text-xs lg:text-sm text-gray-600 truncate border border-gray-200">
                    {task.activity_detail || '-'}
                  </td>

                  {PHASES.slice(0, 8).map((phase, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isAssigned = isCellAssigned(rowIndex, colIndex);
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const hours = parseFloat(task[phase.key]) || 0;

                    const assignedColor = isAssigned ? cellToTaskMap.get(cellKey)?.color : null;

                    let cellClasses = 'px-0 lg:px-1 py-1.5 text-center text-xs lg:text-sm transition-colors ';

                    if (isAssigned) {
                      cellClasses += 'cursor-not-allowed opacity-70 border-2 font-medium ';
                    } else if (isSelected) {
                      cellClasses += 'bg-cyan-100 border-2 border-cyan-500 font-bold text-cyan-900 cursor-pointer ';
                    } else {
                      cellClasses += 'text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer ';
                    }

                    return (
                      <td
                        key={phase.key}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        className={cellClasses}
                        style={isAssigned ? {
                          backgroundColor: assignedColor + '33', // 20% opacity
                          borderColor: assignedColor
                        } : {}}
                        title={isAssigned
                          ? t('estimator:cellTitleAssigned', { phase: t('estimator:' + phase.labelKey), hours: formatHours(hours) })
                          : t('estimator:cellTitle', { phase: t('estimator:' + phase.labelKey), hours: formatHours(hours) })}
                      >
                        {Math.round(hours)}
                      </td>
                    );
                  })}

                  {(() => {
                    const colIndex = 8;
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isAssigned = isCellAssigned(rowIndex, colIndex);
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const hours = getTaskContingency(task);
                    const assignedColor = isAssigned ? cellToTaskMap.get(cellKey)?.color : null;

                    let cellClasses = 'px-0 lg:px-1 py-1.5 text-center text-xs lg:text-sm transition-colors ';

                    if (isAssigned) {
                      cellClasses += 'cursor-not-allowed opacity-70 border-2 font-medium ';
                    } else if (isSelected) {
                      cellClasses += 'bg-cyan-100 border-2 border-cyan-500 font-bold text-cyan-900 cursor-pointer ';
                    } else {
                      cellClasses += 'text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer ';
                    }

                    return (
                      <td
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        className={cellClasses}
                        style={isAssigned ? {
                          backgroundColor: assignedColor + '33',
                          borderColor: assignedColor
                        } : {}}
                        title={isAssigned
                          ? t('estimator:cellTitleAssigned', { phase: t('estimator:phaseContingency'), hours: formatHours(hours) })
                          : t('estimator:cellTitle', { phase: t('estimator:phaseContingency'), hours: formatHours(hours) })}
                      >
                        {Math.round(hours)}
                      </td>
                    );
                  })()}

                  <td className="px-0 lg:px-1 py-1.5 text-center text-xs lg:text-sm font-medium text-cyan-600 border border-gray-200">
                    {Math.round(totalWithContingency)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td colSpan="2" className="px-0.5 lg:px-3 py-4 text-xs lg:text-sm border border-gray-300">
                {t('common:total').toUpperCase()}
              </td>
              {columnTotals.map((total, idx) => (
                <td key={idx} className="px-0 lg:px-1 py-4 text-center text-xs lg:text-sm border border-gray-300">
                  {Math.round(total)}
                </td>
              ))}
              <td className="px-0 lg:px-1 py-4 text-center text-xs lg:text-sm text-cyan-700 border border-gray-300">
                {Math.round(grandTotalWithContingency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>


    </div>
  );
}

export default SelectableCellsTable;
