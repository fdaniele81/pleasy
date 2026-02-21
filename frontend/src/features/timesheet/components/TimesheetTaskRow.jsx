import { useMemo, memo } from "react";
import { useTranslation } from 'react-i18next';
import { AlertCircle, Hourglass } from "lucide-react";
import TimesheetCell from "./TimesheetCell";
import { SelectionCheckbox } from "../../../shared/ui/table";
import {
  getTotalHoursForTask,
  getBudgetColorStatus,
  formatHours,
} from "../../../utils/budget/budgetUtils";
import { getTimesheetForDate } from "../../../utils/table/tableUtils";
import { isHoliday } from "../../../utils/date/workingDays";

const TimesheetTaskRow = memo(function TimesheetTaskRow({
  task,
  taskIdx,
  prevTask,
  dateRange,
  holidays,
  selectedTasks,
  editingTaskId,
  editingCell,
  editValue,
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
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const isEditing = task.task_id === editingTaskId;
  const isTMTask = task.project_type_id === 'TM';

  const totalHours = useMemo(() => {
    if (isTMTask) {
      return (task.tm_hours_before_today || 0) + (task.tm_hours_from_today || 0);
    }
    return getTotalHoursForTask(task);
  }, [task, isTMTask]);
  const budgetColorStatus = useMemo(() => getBudgetColorStatus(task), [task]);

  const deadlineStatus = useMemo(() => {
    if (!task.end_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(task.end_date);
    endDate.setHours(0, 0, 0, 0);

    const tenDaysFromNow = new Date(today);
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    if (endDate < today) {
      return { type: "expired", icon: AlertCircle, date: endDate };
    } else if (endDate <= tenDaysFromNow) {
      return { type: "upcoming", icon: Hourglass, date: endDate };
    }

    return null;
  }, [task.end_date, task.task_id]);

  const cellColorStatus = useMemo(() => {
    if (isTMTask) return "gray";

    if (budgetColorStatus === "red") return "red";

    if (deadlineStatus?.type === "expired") return "red";

    if (budgetColorStatus === "orange" || deadlineStatus?.type === "upcoming")
      return "orange";

    return "gray";
  }, [budgetColorStatus, deadlineStatus, isTMTask]);

  const clientChanged = prevTask && prevTask.client_id !== task.client_id;
  const projectChanged =
    prevTask && !clientChanged && prevTask.project_id !== task.project_id;

  const topBorderClass = clientChanged
    ? "border-t-[5px] border-t-gray-200"
    : projectChanged
    ? "border-t-[5px] border-t-gray-200"
    : "";

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${
        isEditing ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset" : ""
      }`}
    >
      <td
        className={`border-b border-r border-gray-300 px-1 py-1 text-center sticky left-0 z-10 w-8 min-w-8 max-w-8 ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
      >
        <SelectionCheckbox
          checked={!!selectedTasks[task.task_id]}
          onChange={() => onTaskSelection(task.task_id)}
        />
      </td>

      <td
        className={`xl:hidden border-b border-r border-gray-300 py-1 sticky left-8 z-10 w-24 min-w-24 max-w-24 shadow-[2px_0_0_0_rgb(255,255,255)] ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1 h-5 rounded-sm shrink-0"
            style={{ backgroundColor: task.client_color || "#6366F1" }}
          />
          <span className="text-xs text-gray-700 font-medium truncate" title={`${task.client_key}.${task.project_key}.${task.task_number} (${task.client_name} - ${task.project_title})`}>
            {task.client_key}.{task.project_key}.{task.task_number}
          </span>
        </div>
      </td>

      <td
        className={`hidden xl:table-cell border-b border-r border-gray-300 py-1 sticky left-8 z-10 xl:w-24 xl:min-w-24 xl:max-w-24 ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1 h-5 rounded-sm shrink-0"
            style={{ backgroundColor: task.client_color || "#6366F1" }}
          />
          <span className="text-xs text-gray-600 truncate" title={task.client_name}>
            {task.client_name}
          </span>
        </div>
      </td>

      <td
        className={`hidden xl:table-cell border-b border-r border-gray-300 px-2 py-1 sticky left-32 z-10 xl:w-24 xl:min-w-24 xl:max-w-24 shadow-[2px_0_0_0_rgb(255,255,255)] ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
      >
        <span className="text-xs font-semibold text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap block" title={task.project_title}>
          {task.project_title}
        </span>
      </td>

      <td
        className={`border-b border-r border-gray-300 px-2 py-1 sticky left-32 xl:left-56 z-10 w-36 min-w-36 max-w-36 xl:w-56 xl:min-w-56 xl:max-w-56 shadow-[2px_0_0_0_rgb(255,255,255)] ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
      >
        <div
          className="font-medium text-xs overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:text-cyan-600 transition-colors"
          onClick={() => onTaskTitleClick && onTaskTitleClick(task)}
          title={t('timesheet:clickToViewDetails')}
        >
          {task.task_title}
        </div>
      </td>

      <td
        className={`border-b border-r border-gray-300 px-1 py-1 text-center font-bold sticky left-68 xl:left-112 w-20 min-w-20 max-w-20 text-xs z-10 ${
          isEditing
            ? "bg-yellow-50"
            : cellColorStatus === "red"
            ? "bg-red-100"
            : cellColorStatus === "orange"
            ? "bg-orange-50"
            : "bg-gray-100"
        } ${topBorderClass}`}
        onMouseEnter={(e) => onTooltipHover(e, task.task_id)}
        onMouseLeave={onTooltipLeave}
      >
        <div className="flex items-center justify-center gap-1">
          <span
            className={
              cellColorStatus === "red"
                ? "text-red-700 font-extrabold"
                : cellColorStatus === "orange"
                ? "text-orange-600 font-extrabold"
                : "text-gray-700 font-semibold"
            }
          >
            {formatHours(totalHours)}
          </span>
        </div>
      </td>

      {dateRange.map((date, dateIdx) => {
        const { hours, isSubmitted, timesheetId, details } =
          getTimesheetForDate(task, date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHolidayDay = isHoliday(date, holidays);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateNormalized = new Date(date);
        dateNormalized.setHours(0, 0, 0, 0);
        const isToday = dateNormalized.getTime() === today.getTime();

        return (
          <TimesheetCell
            key={dateIdx}
            taskId={task.task_id}
            date={date}
            dateIdx={dateIdx}
            hours={hours}
            isSubmitted={isSubmitted}
            timesheetId={timesheetId}
            details={details}
            isWeekend={isWeekend}
            isHoliday={isHolidayDay}
            isToday={isToday}
            editingCell={editingCell}
            editValue={editValue}
            topBorderClass={topBorderClass}
            onCellClick={onCellClick}
            onCellContextMenu={onCellContextMenu}
            onCellBlur={onCellBlur}
            onKeyDown={onKeyDown}
            onEditValueChange={onEditValueChange}
            onNoteTooltipHover={onNoteTooltipHover}
            onNoteTooltipLeave={onNoteTooltipLeave}
          />
        );
      })}
    </tr>
  );
});

export default TimesheetTaskRow;
