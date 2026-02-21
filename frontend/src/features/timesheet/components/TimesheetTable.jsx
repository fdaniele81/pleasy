import React, { useMemo } from "react";
import { useTranslation } from 'react-i18next';
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
  onCellBlur,
  onKeyDown,
  onEditValueChange,
  onTimeOffCellClick,
  onTimeOffCellContextMenu,
  onTimeOffCellBlur,
  onTimeOffKeyDown,
  onTimeOffTotalClick,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const { getDateInfo } = useTableDateHelpers(dateRange, holidays);

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
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-cyan-700 text-white sticky top-0 z-40">
            <th className="border-t border-r border-gray-300 px-1 py-1 text-center font-semibold sticky left-0 top-0 bg-cyan-700 z-50 w-8 min-w-8 max-w-8">
              <SelectionCheckbox
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th className="xl:hidden border-t border-r border-gray-300 px-2 py-1 text-left font-semibold sticky left-8 top-0 bg-cyan-700 z-50 w-24 min-w-24 max-w-24 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs">
              {t('timesheet:codeColumn')}
            </th>
            <th className="hidden xl:table-cell border-t border-r border-gray-300 px-2 py-1 text-left font-semibold sticky left-8 top-0 bg-cyan-700 z-50 xl:w-24 xl:min-w-24 xl:max-w-24 text-xs">
              {t('timesheet:clientColumn')}
            </th>
            <th className="hidden xl:table-cell border-t border-r border-gray-300 px-2 py-1 text-left font-semibold sticky left-32 top-0 bg-cyan-700 z-50 xl:w-24 xl:min-w-24 xl:max-w-24 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs">
              {t('timesheet:projectColumn')}
            </th>
            <th className="border-t border-r border-gray-300 px-2 py-1 text-left font-semibold sticky left-32 xl:left-56 top-0 bg-cyan-700 z-50 w-36 min-w-36 max-w-36 xl:w-56 xl:min-w-56 xl:max-w-56 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs">
              {t('timesheet:activityColumn')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-1 text-center font-semibold bg-cyan-700 sticky left-68 xl:left-112 top-0 z-50 w-20 min-w-20 max-w-20 text-xs">
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

          <tr className="bg-cyan-700 text-white font-bold sticky top-14 z-30 shadow-[0_-1px_0_0_rgb(209,213,219)]">
            <th className="border-t border-b border-r border-gray-300 px-1 py-1 text-center sticky left-0 top-14 bg-cyan-700 z-40 w-8 min-w-8 max-w-8"></th>
            <th className="xl:hidden border-t border-b border-r border-gray-300 px-2 py-1 text-left sticky left-8 top-14 bg-cyan-700 z-40 w-60 min-w-60 max-w-60 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs font-semibold" colSpan="2">
              {t('timesheet:dailyTotal')}
            </th>
            <th className="hidden xl:table-cell border-t border-b border-r border-gray-300 px-2 py-1 text-left sticky left-8 top-14 bg-cyan-700 z-40 xl:w-104 xl:min-w-104 shadow-[2px_0_0_0_rgb(8,145,178)] text-xs font-semibold" colSpan="3">
              {t('timesheet:dailyTotal')}
            </th>

            <th className="border-t border-b border-r border-gray-300 px-1 py-1 text-center bg-cyan-700 sticky left-68 xl:left-112 top-14 z-40 w-20 min-w-20 max-w-20 text-xs font-bold">
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
                if (dateInfo.isToday) return "bg-cyan-500 text-white";
                if (dateInfo.isNonWorking) return "bg-gray-600";
                return "bg-cyan-700";
              };

              return (
                <th
                  key={idx}
                  className={`border-t border-b border-r border-gray-300 px-1 py-1 text-center text-xs font-semibold sticky top-14 z-30 text-white ${getBgClass()}`}
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
                  <td colSpan={dateRange.length + 6} className="px-4 py-2 text-white font-bold text-sm tracking-wide">
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
                      onCellBlur={onCellBlur}
                      onKeyDown={onKeyDown}
                      onEditValueChange={onEditValueChange}
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
                  <td colSpan={dateRange.length + 6} className="bg-gray-300"></td>
                </tr>
                <tr className="bg-cyan-900">
                  <td colSpan={dateRange.length + 6} className="px-4 py-2 text-white font-bold text-sm tracking-wide">
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
                      onCellBlur={onCellBlur}
                      onKeyDown={onKeyDown}
                      onEditValueChange={onEditValueChange}
                    />
                  );
                })}
              </>
            );
          })()}

          <tr className="h-4">
            <td
              colSpan={dateRange.length + 5}
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
                    colSpan={dateRange.length + 5}
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
    </TableContainer>
  );
}

export default TimesheetTable;
