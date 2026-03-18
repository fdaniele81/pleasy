import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUpDown, Check, X, Merge, Scissors, Copy } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { formatDateISO } from '../../../utils/date/dateUtils';
import { formatHours, getUnitLabel, safeFormatDate, getFilteredMetrics, getProjectDateRange } from '../utils/helpers';

export const ProjectRow = memo(function ProjectRow({
  project,
  selectedTasks,
  toggleProjectSelection,
  expandedProjects,
  toggleProjectExpansion,
  handleStartAddingTask,
  showInDays,
  showTimeline,
  dateRange,
  columnWidth,
  timelineWidth,
  todayLineOffset,
  getDateInfo,
  onLabelTooltipHover,
  onLabelTooltipLeave,
  reorderingProjectId,
  onStartReordering,
  onSaveReordering,
  onCancelReordering,
  onStartMerge,
  onStartSplit,
  onCloneTasks,
  selectedTaskCount,
}) {
  const { t } = useTranslation(['planning', 'common']);
  const metrics = useMemo(() => getFilteredMetrics(project), [project]);
  const variance = useMemo(() => metrics.delta, [metrics]);
  const { minDate, maxDate } = useMemo(() => getProjectDateRange(project), [project]);

  const summaryBarPosition = useMemo(() => {
    if (!showTimeline || !minDate || !maxDate || !dateRange || dateRange.length === 0) return null;

    const rangeStartISO = formatDateISO(dateRange[0]);
    const rangeEndISO = formatDateISO(dateRange[dateRange.length - 1]);
    const projStart = formatDateISO(new Date(minDate));
    const projEnd = formatDateISO(new Date(maxDate));

    if (projEnd < rangeStartISO || projStart > rangeEndISO) return null;

    const clampedStart = projStart < rangeStartISO ? rangeStartISO : projStart;
    const clampedEnd = projEnd > rangeEndISO ? rangeEndISO : projEnd;

    const startDate = new Date(clampedStart);
    const rangeStart = new Date(dateRange[0]);
    rangeStart.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const dayOffset = Math.round((startDate - rangeStart) / (1000 * 60 * 60 * 24));

    const endDate = new Date(clampedEnd);
    endDate.setHours(0, 0, 0, 0);
    const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const left = dayOffset * columnWidth;
    const width = Math.max(durationDays * columnWidth, 4);

    const isStartClipped = projStart < rangeStartISO;
    const isEndClipped = projEnd > rangeEndISO;

    return { left, width, isStartClipped, isEndClipped };
  }, [showTimeline, minDate, maxDate, dateRange, columnWidth]);

  const formattedBudget = useMemo(() => formatHours(metrics.budget, showInDays), [metrics.budget, showInDays]);
  const formattedActual = useMemo(() => formatHours(metrics.actual, showInDays), [metrics.actual, showInDays]);
  const formattedEtc = useMemo(() => formatHours(metrics.etc, showInDays), [metrics.etc, showInDays]);
  const formattedEac = useMemo(() => formatHours(metrics.eac, showInDays), [metrics.eac, showInDays]);
  const formattedVariance = useMemo(() => formatHours(variance, showInDays), [variance, showInDays]);

  return (
    <tr className="bg-gray-100 group">
      {/* Checkbox - always shown */}
      <td className="border-l border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
        <SelectionCheckbox
          checked={
            project.tasks.length > 0
              ? project.tasks.every(t => selectedTasks[t.task_id])
              : selectedTasks[`project_${project.project_id}`] || false
          }
          onChange={() => toggleProjectSelection(project)}
        />
      </td>

      {/* Project title - colSpan changes based on timeline mode */}
      <td
        colSpan={showTimeline ? 1 : 4}
        className="border-b border-r border-gray-300 px-1.5 py-2 bg-gray-100 group-hover:bg-gray-200"
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-1.5 overflow-hidden min-w-0"
            onMouseEnter={(e) => onLabelTooltipHover?.(e, {
              client: project.client_name,
              project: project.title,
              task: null,
              color: project.symbol_bg_color || project.client_color,
            })}
            onMouseLeave={onLabelTooltipLeave}
          >
            <Button
              onClick={() => toggleProjectExpansion(project.project_id)}
              isExpandButton
              isExpanded={expandedProjects[project.project_id]}
              title={expandedProjects[project.project_id] ? t('common:collapse') : t('common:expand')}
              className="text-gray-500 hover:text-gray-700 shrink-0"
            />
            <div
              className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
              style={{
                backgroundColor: project.symbol_bg_color || project.client_color || '#6366F1',
                color: project.symbol_letter_color || '#FFFFFF',
              }}
            >
              {project.symbol_letter || (project.client_name || '?')[0].toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800 text-sm truncate">
              {project.title}
              <span className="font-normal text-gray-500 text-xs ml-1">
                ({project.client_key}-{project.project_key})
              </span>
            </span>
          </div>
          {!showTimeline && expandedProjects[project.project_id] && (
            <div className="flex items-center gap-0.5 shrink-0">
              {reorderingProjectId === project.project_id ? (
                <>
                  <button
                    onClick={onSaveReordering}
                    onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:reorderSave') })}
                    onMouseLeave={onLabelTooltipLeave}
                    className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-gray-200 transition-colors"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={onCancelReordering}
                    onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:reorderCancel') })}
                    onMouseLeave={onLabelTooltipLeave}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  {project.tasks.length > 1 && (
                    <button
                      onClick={() => onStartReordering(project.project_id, project.tasks)}
                      onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:reorderActivities') })}
                      onMouseLeave={onLabelTooltipLeave}
                      className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowUpDown size={14} />
                    </button>
                  )}
                  {selectedTaskCount >= 2 && (
                    <button
                      onClick={() => onStartMerge(project.project_id)}
                      onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:mergeActivities') })}
                      onMouseLeave={onLabelTooltipLeave}
                      className="p-1 rounded text-gray-400 hover:text-cyan-600 hover:bg-gray-200 transition-colors"
                    >
                      <Merge size={14} />
                    </button>
                  )}
                  {selectedTaskCount === 1 && (
                    <button
                      onClick={() => onStartSplit(project.project_id)}
                      onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:splitActivity') })}
                      onMouseLeave={onLabelTooltipLeave}
                      className="p-1 rounded text-gray-400 hover:text-cyan-600 hover:bg-gray-200 transition-colors"
                    >
                      <Scissors size={14} />
                    </button>
                  )}
                  {selectedTaskCount >= 1 && (
                    <button
                      onClick={() => onCloneTasks(project.project_id)}
                      onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:cloneActivities') })}
                      onMouseLeave={onLabelTooltipLeave}
                      className="p-1 rounded text-gray-400 hover:text-cyan-600 hover:bg-gray-200 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleStartAddingTask(project.project_id)}
                    onMouseEnter={(e) => onLabelTooltipHover?.(e, { text: t('planning:addActivity') })}
                    onMouseLeave={onLabelTooltipLeave}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </td>

      {showTimeline ? (
        <>
          {/* Empty compact status cell */}
          <td className="border-b border-r border-gray-300 px-1 py-2 bg-gray-100 group-hover:bg-gray-200" />

          {/* Empty compact user cell */}
          <td className="border-b border-r border-gray-300 px-1 py-2 bg-gray-100 group-hover:bg-gray-200" />

          {/* Timeline cell with project summary bar */}
          <td
            className="border-b border-gray-200 p-0 bg-gray-100 group-hover:bg-gray-200"
            style={{ width: timelineWidth }}
          >
            <div className="relative" style={{ width: timelineWidth, height: 24 }}>
              {/* Project summary bar */}
              {summaryBarPosition && (
                <div
                  className="absolute top-1 pointer-events-none"
                  style={{
                    left: summaryBarPosition.left,
                    width: summaryBarPosition.width,
                    height: 16,
                    backgroundColor: project.symbol_bg_color || project.client_color || '#6366F1',
                    opacity: 0.7,
                    borderRadius:
                      summaryBarPosition.isStartClipped && summaryBarPosition.isEndClipped ? '0' :
                      summaryBarPosition.isStartClipped ? '0 4px 4px 0' :
                      summaryBarPosition.isEndClipped ? '4px 0 0 4px' : '4px',
                  }}
                />
              )}
              {/* Today line */}
              {todayLineOffset !== null && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-orange-400/40 pointer-events-none z-10"
                  style={{ left: todayLineOffset }}
                />
              )}
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Progress */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
            <span className="xl:hidden text-xs font-medium text-gray-700">
              {metrics.progress}%
            </span>
            <div className="hidden xl:flex items-center gap-1 justify-center">
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden min-w-10">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.min(metrics.progress || 0, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 w-8 text-right shrink-0">
                {metrics.progress}%
              </span>
            </div>
          </td>

          {/* Budget */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200 whitespace-nowrap">
            {formattedBudget}{getUnitLabel(showInDays)}
          </td>

          {/* Actual */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200 whitespace-nowrap">
            {formattedActual}{getUnitLabel(showInDays)}
          </td>

          {/* ETC */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200 whitespace-nowrap">
            {formattedEtc}{getUnitLabel(showInDays)}
          </td>

          {/* EAC */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200 whitespace-nowrap">
            {formattedEac}{getUnitLabel(showInDays)}
          </td>

          {/* Delta */}
          <td className="border-b border-r border-gray-300 px-1 py-2 bg-gray-100 group-hover:bg-gray-200">
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs font-bold text-gray-700">
                {variance > 0 ? '+' : ''}{formattedVariance}{getUnitLabel(showInDays)}
              </span>
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                variance > 0 ? 'bg-green-500' : variance === 0 ? 'bg-gray-400' : 'bg-red-500'
              }`}></div>
            </div>
          </td>

          {/* Start Date */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
            <span className="text-xs font-medium text-gray-700">
              {minDate ? safeFormatDate(minDate) : '-'}
            </span>
          </td>

          {/* End Date */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
            <span className="text-xs font-medium text-gray-700">
              {maxDate ? safeFormatDate(maxDate) : '-'}
            </span>
          </td>

          {/* Empty action cell */}
          <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200"></td>
        </>
      )}
    </tr>
  );
});
