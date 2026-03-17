import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import { Briefcase, FolderKanban, ListTodo } from "lucide-react";
import TimesheetTaskRow from "./TimesheetTaskRow";
import TimesheetTimeOffRow from "./TimesheetTimeOffRow";
import TimesheetClosedTasksRow from "./TimesheetClosedTasksRow";
import { useLocale } from "../../../hooks/useLocale";
import {
  TableContainer,
  DateColumnHeader,
  SelectionCheckbox,
  NoteIndicator,
  useTableDateHelpers,
} from "../../../shared/ui/table";
import { getTotalHoursForTask, getBudgetRemaining, getBudgetColorStatus } from "../../../utils/budget/budgetUtils";

function TimesheetTable({
  dateRange,
  filteredTasks,
  selectedTasks,
  editingTaskId,
  editingCell,
  editValue,
  holidays,
  timeOffs,
  timeOffHistoricalTotals,
  showTimeOff,
  selectionFilters,
  hoveredTaskId,
  tooltipPosition,
  hoveredNoteCell,
  noteTooltipPosition,
  getTotalHoursForDate,
  getGrandTotal,
  getClosedTasksHoursForDate,
  getClosedTasksGrandTotal,
  onSelectAll,
  onTaskSelection,
  onTooltipHover,
  onTooltipLeave,
  onNoteTooltipHover,
  onNoteTooltipLeave,
  onTaskTitleClick,
  onCellClick,
  onCellContextMenu,
  onCellNoteClick,
  onCellBlur,
  onKeyDown,
  onEditValueChange,
  onTimeOffCellClick,
  onTimeOffCellContextMenu,
  onTimeOffCellNoteClick,
  onTimeOffCellBlur,
  onTimeOffKeyDown,
  onTimeOffTotalClick,
  onTaskHistoryClick,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const { getDateInfo } = useTableDateHelpers(dateRange, holidays);

  const [labelTooltip, setLabelTooltip] = useState(null);
  const labelTooltipTimeout = useRef(null);
  const tableRef = useRef(null);
  const headerRowRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(48);

  useEffect(() => {
    if (!headerRowRef.current) return;
    const measure = () => setHeaderHeight(headerRowRef.current.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(headerRowRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const scrollContainer = tableRef.current?.closest('.overflow-y-auto');
    if (!scrollContainer) return;
    const onScroll = () => {
      clearTimeout(labelTooltipTimeout.current);
      setLabelTooltip(null);
    };
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', onScroll);
  }, []);

  const showLabelTooltip = useCallback((e, content) => {
    clearTimeout(labelTooltipTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const above = rect.bottom + 60 > window.innerHeight;
    labelTooltipTimeout.current = setTimeout(() => {
      setLabelTooltip({
        content,
        x: rect.left + rect.width / 2,
        y: above ? rect.top : rect.bottom,
        above,
      });
    }, 500);
  }, []);

  const hideLabelTooltip = useCallback(() => {
    clearTimeout(labelTooltipTimeout.current);
    setLabelTooltip(null);
  }, []);

  const allSelected = filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedTasks[t.task_id]);

  const handleSelectAll = (e) => {
    const allTaskIds = filteredTasks.map((t) => t.task_id);
    const newSelected = {};
    if (e.target.checked) {
      allTaskIds.forEach((id) => (newSelected[id] = true));
    }
    onSelectAll(newSelected);
  };

  const tooltipData = useMemo(() => {
    if (!hoveredTaskId) return null;

    const task = filteredTasks.find(t => t.task_id === hoveredTaskId);
    if (!task) return null;

    const isTMTask = task.project_type_id === 'TM';

    if (isTMTask) {
      const tmHoursBeforeToday = task.tm_hours_before_today || 0;
      const tmHoursFromToday = task.tm_hours_from_today || 0;
      return {
        type: 'TM',
        tmHoursBeforeToday,
        tmHoursFromToday,
        totalHours: tmHoursBeforeToday + tmHoursFromToday,
        colorStatus: 'gray'
      };
    }

    const actual = getTotalHoursForTask(task);
    const budget = task.budget || 0;
    const budgetRemaining = getBudgetRemaining(task);
    const percentage = budget > 0 ? (actual / budget) * 100 : (actual > 0 ? 100 : 0);
    const budgetColorStatus = getBudgetColorStatus(task);

    let deadlineInfo = null;
    if (task.end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(task.end_date);
      endDate.setHours(0, 0, 0, 0);
      const tenDaysFromNow = new Date(today);
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

      if (endDate < today) {
        deadlineInfo = { type: 'expired', label: t('timesheet:expired'), date: endDate };
      } else if (endDate <= tenDaysFromNow) {
        deadlineInfo = { type: 'upcoming', label: t('timesheet:upcoming'), date: endDate };
      } else {
        deadlineInfo = { type: 'normal', label: t('timesheet:deadline'), date: endDate };
      }
    }

    let colorStatus;
    if (budgetColorStatus === "red") {
      colorStatus = "red";
    } else if (deadlineInfo?.type === 'expired') {
      colorStatus = "red";
    } else if (budgetColorStatus === "orange" || deadlineInfo?.type === 'upcoming') {
      colorStatus = "orange";
    } else {
      colorStatus = "gray";
    }

    return {
      type: 'PROJECT',
      actual,
      budget,
      budgetRemaining,
      percentage,
      deadlineInfo,
      colorStatus
    };
  }, [hoveredTaskId, filteredTasks]);

  return (
    <TableContainer maxHeight="calc(100vh - 280px)" className="rounded-lg">
      <table ref={tableRef} className="w-full border-separate border-spacing-0">
        <thead>
          <tr ref={headerRowRef} className="bg-cyan-700 text-white sticky top-0 z-40">
            <th className="border-t border-b border-r border-gray-300 px-1 py-1 text-center font-semibold sticky left-0 top-0 bg-cyan-700 z-50 w-8 min-w-8 max-w-8">
              <SelectionCheckbox
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th className="border-t border-b border-r border-gray-300 px-2 py-1 text-left font-semibold sticky left-8 top-0 bg-cyan-700 z-50 w-44 min-w-44 max-w-44 xl:w-56 xl:min-w-56 xl:max-w-56 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs">
              {t('timesheet:activityColumn')}
            </th>
            <th className="border-t border-b border-r border-gray-300 px-1 py-1 text-center font-semibold bg-cyan-700 sticky left-52 xl:left-64 top-0 z-50 w-20 min-w-20 max-w-20 text-xs">
              {t('timesheet:totalColumn')}
            </th>
            {dateRange.map((date, idx) => {
              const dateInfo = getDateInfo(date);
              return (
                <DateColumnHeader
                  key={idx}
                  date={date}
                  isWeekend={dateInfo.isWeekend}
                  isHoliday={dateInfo.isHoliday}
                  isToday={dateInfo.isToday}
                  holidayName={dateInfo.holidayName}
                  showMonth={idx === 0}
                  variant="compact"
                  className="sticky top-0 z-40"
                />
              );
            })}
          </tr>

          <tr className="bg-cyan-700 text-white font-bold sticky z-35" style={{ top: headerHeight }}>
            <th className="border-b border-r border-gray-300 px-1 py-1 text-center sticky left-0 bg-cyan-700 z-40 w-8 min-w-8 max-w-8" style={{ top: headerHeight }}></th>
            <th className="border-b border-r border-gray-300 px-2 py-1 text-left sticky left-8 bg-cyan-700 z-40 w-44 min-w-44 max-w-44 xl:w-56 xl:min-w-56 xl:max-w-56 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs font-semibold" style={{ top: headerHeight }}>
              {t('timesheet:dailyTotal')}
            </th>

            <th className="border-b border-r border-gray-300 px-1 py-1 text-center bg-cyan-700 sticky left-52 xl:left-64 z-40 w-20 min-w-20 max-w-20 text-xs font-bold" style={{ top: headerHeight }}>
              {getGrandTotal().toFixed(1)}
            </th>

            {dateRange.map((date, idx) => {
              const total = getTotalHoursForDate(date);
              const dateInfo = getDateInfo(date);
              const isOvertime = total > 8;
              const isFullDay = total === 8;

              const getBgClass = () => {
                if (isOvertime) return "bg-red-500";
                if (isFullDay) return "bg-green-500";
                if (dateInfo.isToday) return "bg-cyan-700 text-white shadow-[inset_2px_0_0_0_#22d3ee,inset_-2px_0_0_0_#22d3ee]";
                if (dateInfo.isNonWorking) return "bg-gray-600";
                return "bg-cyan-700";
              };

              return (
                <th
                  key={idx}
                  className={`border-b border-r border-gray-300 px-1 py-1 text-center text-xs font-semibold sticky z-30 text-white ${getBgClass()}`}
                  style={{ top: headerHeight }}
                >
                  {total > 0 ? total.toFixed(1) : "-"}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {(() => {
            const projectTasks = filteredTasks.filter(t => t.project_type_id === 'PROJECT' || !t.project_type_id);
            if (projectTasks.length === 0) return null;

            return (
              <>
                <tr className="bg-cyan-900">
                  <td colSpan={dateRange.length + 4} className="px-4 py-2 text-white font-bold text-sm tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                      {t('timesheet:plannedActivitiesSection')}
                    </div>
                  </td>
                </tr>
                {projectTasks.map((task, taskIdx) => {
                  const prevTask = taskIdx > 0 ? projectTasks[taskIdx - 1] : null;

                  return (
                    <TimesheetTaskRow
                      key={task.task_id}
                      task={task}
                      taskIdx={taskIdx}
                      prevTask={prevTask}
                      dateRange={dateRange}
                      holidays={holidays}
                      selectedTasks={selectedTasks}
                      editingTaskId={editingTaskId}
                      editingCell={editingCell}
                      editValue={editValue}
                      onTaskSelection={onTaskSelection}
                      onTooltipHover={onTooltipHover}
                      onTooltipLeave={onTooltipLeave}
                      onNoteTooltipHover={onNoteTooltipHover}
                      onNoteTooltipLeave={onNoteTooltipLeave}
                      onTaskTitleClick={onTaskTitleClick}
                      onCellClick={onCellClick}
                      onCellContextMenu={onCellContextMenu}
                      onCellNoteClick={onCellNoteClick}
                      onCellBlur={onCellBlur}
                      onKeyDown={onKeyDown}
                      onEditValueChange={onEditValueChange}
                      onTaskHistoryClick={onTaskHistoryClick}
                      onLabelTooltipHover={showLabelTooltip}
                      onLabelTooltipLeave={hideLabelTooltip}
                    />
                  );
                })}
              </>
            );
          })()}

          {(() => {
            const tmTasks = filteredTasks.filter(t => t.project_type_id === 'TM');
            if (tmTasks.length === 0) return null;

            return (
              <>
                <tr className="h-2">
                  <td colSpan={dateRange.length + 4} className="bg-gray-300"></td>
                </tr>
                <tr className="bg-cyan-900">
                  <td colSpan={dateRange.length + 4} className="px-4 py-2 text-white font-bold text-sm tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {t('timesheet:calendarClientsSection')}
                    </div>
                  </td>
                </tr>
                {tmTasks.map((task, taskIdx) => {
                  const prevTask = taskIdx > 0 ? tmTasks[taskIdx - 1] : null;

                  return (
                    <TimesheetTaskRow
                      key={task.task_id}
                      task={task}
                      taskIdx={taskIdx}
                      prevTask={prevTask}
                      dateRange={dateRange}
                      holidays={holidays}
                      selectedTasks={selectedTasks}
                      editingTaskId={editingTaskId}
                      editingCell={editingCell}
                      editValue={editValue}
                      onTaskSelection={onTaskSelection}
                      onTooltipHover={onTooltipHover}
                      onTooltipLeave={onTooltipLeave}
                      onNoteTooltipHover={onNoteTooltipHover}
                      onNoteTooltipLeave={onNoteTooltipLeave}
                      onTaskTitleClick={onTaskTitleClick}
                      onCellClick={onCellClick}
                      onCellContextMenu={onCellContextMenu}
                      onCellNoteClick={onCellNoteClick}
                      onCellBlur={onCellBlur}
                      onKeyDown={onKeyDown}
                      onEditValueChange={onEditValueChange}
                      onTaskHistoryClick={onTaskHistoryClick}
                      onLabelTooltipHover={showLabelTooltip}
                      onLabelTooltipLeave={hideLabelTooltip}
                    />
                  );
                })}
              </>
            );
          })()}

          <tr className="h-4">
            <td
              colSpan={dateRange.length + 4}
              className="bg-gray-200"
            ></td>
          </tr>

          <TimesheetClosedTasksRow
            dateRange={dateRange}
            holidays={holidays}
            getClosedTasksHoursForDate={getClosedTasksHoursForDate}
            getClosedTasksGrandTotal={getClosedTasksGrandTotal}
          />

          {showTimeOff &&
            (selectionFilters.length === 0 ||
              selectionFilters.length === 2 ||
              (selectionFilters.includes("selected") &&
                (selectedTasks["timeoff-VACATION"] ||
                  selectedTasks["timeoff-OTHER"])) ||
              (selectionFilters.includes("unselected") &&
                (!selectedTasks["timeoff-VACATION"] ||
                  !selectedTasks["timeoff-OTHER"]))) && (
              <>
                <tr className="h-4">
                  <td
                    colSpan={dateRange.length + 4}
                    className="bg-gray-200"
                  ></td>
                </tr>

                {(selectionFilters.length === 0 ||
                  selectionFilters.length === 2 ||
                  (selectionFilters.includes("selected") &&
                    selectedTasks["timeoff-VACATION"]) ||
                  (selectionFilters.includes("unselected") &&
                    !selectedTasks["timeoff-VACATION"])) && (
                  <TimesheetTimeOffRow
                    timeOffType="VACATION"
                    dateRange={dateRange}
                    timeOffs={timeOffs}
                    timeOffHistoricalTotals={timeOffHistoricalTotals}
                    holidays={holidays}
                    selectedTasks={selectedTasks}
                    editingCell={editingCell}
                    editValue={editValue}
                    onTaskSelection={onTaskSelection}
                    onTimeOffCellClick={onTimeOffCellClick}
                    onTimeOffCellContextMenu={onTimeOffCellContextMenu}
                    onTimeOffCellNoteClick={onTimeOffCellNoteClick}
                    onTimeOffCellBlur={onTimeOffCellBlur}
                    onTimeOffKeyDown={onTimeOffKeyDown}
                    onEditValueChange={onEditValueChange}
                    onNoteTooltipHover={onNoteTooltipHover}
                    onNoteTooltipLeave={onNoteTooltipLeave}
                    onTotalClick={onTimeOffTotalClick}
                  />
                )}

                {(selectionFilters.length === 0 ||
                  selectionFilters.length === 2 ||
                  (selectionFilters.includes("selected") &&
                    selectedTasks["timeoff-OTHER"]) ||
                  (selectionFilters.includes("unselected") &&
                    !selectedTasks["timeoff-OTHER"])) && (
                  <TimesheetTimeOffRow
                    timeOffType="OTHER"
                    dateRange={dateRange}
                    timeOffs={timeOffs}
                    timeOffHistoricalTotals={timeOffHistoricalTotals}
                    holidays={holidays}
                    selectedTasks={selectedTasks}
                    editingCell={editingCell}
                    editValue={editValue}
                    onTaskSelection={onTaskSelection}
                    onTimeOffCellClick={onTimeOffCellClick}
                    onTimeOffCellContextMenu={onTimeOffCellContextMenu}
                    onTimeOffCellNoteClick={onTimeOffCellNoteClick}
                    onTimeOffCellBlur={onTimeOffCellBlur}
                    onTimeOffKeyDown={onTimeOffKeyDown}
                    onEditValueChange={onEditValueChange}
                    onNoteTooltipHover={onNoteTooltipHover}
                    onNoteTooltipLeave={onNoteTooltipLeave}
                    onTotalClick={onTimeOffTotalClick}
                  />
                )}
              </>
            )}
        </tbody>
      </table>

      {tooltipData && tooltipData.type === 'TM' && (
        <div
          className="fixed px-3 py-2 rounded-lg shadow-lg text-white text-sm font-semibold whitespace-nowrap -translate-y-1/2 bg-gray-600"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 9999,
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>{t('timesheet:hoursDelivered')}</span>
              <span className="text-base font-bold">
                {tooltipData.tmHoursBeforeToday.toFixed(1)} ore
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{t('timesheet:hoursPlanned')}</span>
              <span className="text-base font-bold">
                {tooltipData.tmHoursFromToday.toFixed(1)} ore
              </span>
            </div>
            <div className="border-t border-white/20 pt-2 mt-1">
              <div className="flex items-center gap-2">
                <span>{t('timesheet:totalLabel')}</span>
                <span className="text-base font-bold">
                  {tooltipData.totalHours.toFixed(1)} ore
                </span>
              </div>
            </div>
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-600"></div>
        </div>
      )}

      {tooltipData && tooltipData.type === 'PROJECT' && (
        <div
          className={`fixed px-3 py-2 rounded-lg shadow-lg text-white text-sm font-semibold whitespace-nowrap -translate-y-1/2 ${
            tooltipData.colorStatus === "red"
              ? "bg-red-600"
              : tooltipData.colorStatus === "orange"
              ? "bg-orange-500"
              : "bg-gray-600"
          }`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 9999,
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>{t('timesheet:initialEstimate')}</span>
              <span className="text-base font-bold">
                {tooltipData.budget.toFixed(1)} ore
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{t('timesheet:reported')}</span>
              <span className="text-base font-bold">
                {tooltipData.actual.toFixed(1)} ore
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {tooltipData.percentage >= 80 && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
                {t('timesheet:remainingHours')}
              </span>
              <span className="text-base font-bold">
                {tooltipData.budgetRemaining.toFixed(1)} ore
              </span>
            </div>

            {tooltipData.deadlineInfo && (
              <div className="border-t border-white/20 pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    {(tooltipData.deadlineInfo.type === 'expired' || tooltipData.deadlineInfo.type === 'upcoming') && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                    {tooltipData.deadlineInfo.label}:
                  </span>
                  <span className="text-base font-bold">
                    {tooltipData.deadlineInfo.date.toLocaleDateString(locale)}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t border-white/20 pt-2 mt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">{t('timesheet:consumption')}</span>
                <span className="text-sm font-bold">
                  {tooltipData.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    tooltipData.percentage > 100
                      ? "bg-white"
                      : tooltipData.percentage >= 80
                      ? "bg-white/90"
                      : "bg-white/80"
                  }`}
                  style={{
                    width: `${Math.min(tooltipData.percentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div
            className={`absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent ${
              tooltipData.colorStatus === "red"
                ? "border-r-red-600"
                : tooltipData.colorStatus === "orange"
                ? "border-r-orange-500"
                : "border-r-gray-600"
            }`}
          ></div>
        </div>
      )}

      <NoteIndicator.Tooltip
        note={hoveredNoteCell?.details}
        position={noteTooltipPosition}
        visible={!!hoveredNoteCell?.details}
      />

      {labelTooltip && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2.5 rounded-lg shadow-xl bg-gray-900 text-white text-xs min-w-48 max-w-sm border border-gray-600 pointer-events-none"
          style={{
            left: labelTooltip.x,
            top: labelTooltip.above ? labelTooltip.y : labelTooltip.y + 4,
            transform: labelTooltip.above
              ? 'translate(-50%, calc(-100% - 4px))'
              : 'translate(-50%, 0)',
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: labelTooltip.content.color || '#6366F1' }} />
              <Briefcase className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="font-semibold text-gray-100">{labelTooltip.content.client}</span>
            </div>
            {labelTooltip.content.project && (
              <div className="flex items-center gap-1.5 text-gray-300 pl-4">
                <FolderKanban className="h-3 w-3 text-gray-400 shrink-0" />
                {labelTooltip.content.project}
              </div>
            )}
            {labelTooltip.content.task && (
              <div className="flex items-center gap-1.5 pl-4 text-gray-200 text-xs">
                <ListTodo className="h-3 w-3 text-gray-400 shrink-0" />
                {labelTooltip.content.task}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </TableContainer>
  );
}

export default TimesheetTable;
