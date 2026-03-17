import { useMemo, memo } from "react";
import { useTranslation } from 'react-i18next';
import { AlertCircle, Hourglass, ExternalLink, Briefcase, FolderKanban, ListTodo } from "lucide-react";
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
  onCellNoteClick,
  onCellBlur,
  onKeyDown,
  onEditValueChange,
  onTaskHistoryClick,
  onLabelTooltipHover,
  onLabelTooltipLeave,
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
        className={`border-b border-r border-gray-300 px-1.5 py-1 sticky left-8 z-10 w-44 min-w-44 max-w-44 xl:w-56 xl:min-w-56 xl:max-w-56 shadow-[2px_0_0_0_rgb(255,255,255)] ${
          isEditing ? "bg-yellow-50" : "bg-white"
        } ${topBorderClass}`}
        onMouseEnter={(e) => onLabelTooltipHover(e, {
          client: task.client_name,
          project: isTMTask ? null : task.project_title,
          task: isTMTask ? null : task.task_title,
          color: task.symbol_bg_color || task.client_color,
        })}
        onMouseLeave={onLabelTooltipLeave}
      >
        <div className="flex gap-1.5 min-w-0 items-center">
          <div
            className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
            style={{
              backgroundColor: task.symbol_bg_color || task.client_color || "#6366F1",
              color: task.symbol_letter_color || "#FFFFFF",
            }}
          >
            {task.symbol_letter || (task.client_name || '?')[0].toUpperCase()}
          </div>
          {isTMTask ? (
            <div className="min-w-0 flex-1 flex items-center">
              <span className="text-xs text-gray-600 truncate">{task.client_name}</span>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="text-[11px] leading-tight text-gray-400 truncate flex items-center gap-1">
                <FolderKanban className="h-2.5 w-2.5 shrink-0 text-gray-500" /><span className="text-gray-500">{task.project_title}</span>
              </div>
              <div
                className="text-xs leading-tight font-medium text-gray-800 truncate cursor-pointer hover:text-cyan-600 transition-colors flex items-center gap-1"
                onClick={() => onTaskTitleClick && onTaskTitleClick(task)}
              >
                <ListTodo className="h-3 w-3 shrink-0" />{task.task_title}
              </div>
            </div>
          )}
        </div>
      </td>

      <td
        className={`border-b border-r border-gray-300 px-1 py-1 text-center font-bold sticky left-52 xl:left-64 w-20 min-w-20 max-w-20 text-xs z-10 ${
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
        <div className="relative flex items-center justify-center">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskHistoryClick && onTaskHistoryClick(task);
            }}
            className="absolute right-0 p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-cyan-600"
            title={t('timesheet:taskHistory')}
          >
            <ExternalLink size={12} />
          </button>
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
            onCellNoteClick={onCellNoteClick}
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
