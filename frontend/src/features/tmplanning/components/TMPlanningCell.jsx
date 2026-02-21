import React, { memo } from "react";
import { formatDateISO } from "../../../utils/date/dateUtils";

const TMPlanningCell = memo(function TMPlanningCell({
  taskId,
  date,
  dateIdx,
  timesheets,
  dateInfo,
  hoursEditCell,
  onCellClick,
  onCellBlur,
  onKeyDown,
  onCellContextMenu,
  onNoteTooltipHover,
  onNoteTooltipLeave,
  contextClient,
}) {
  const timesheet = timesheets?.find((t) => t.work_date === formatDateISO(date));
  const hours = timesheet?.hours_worked;
  const details = timesheet?.details;
  const isSubmitted = timesheet?.is_submitted;
  const dateStr = formatDateISO(date);
  const cellKey = `${taskId}-${dateStr}`;
  const isEditing = hoursEditCell.editingCell === cellKey;
  return (
    <td
      className={`px-0 py-1 text-center border-b border-r border-gray-200 ${
        dateInfo.isNonWorking
          ? "bg-gray-200"
          : dateInfo.isToday
          ? "bg-violet-50"
          : ""
      } cursor-pointer`}
      onClick={() =>
        !isEditing &&
        onCellClick(taskId, date, hours, isSubmitted, details)
      }
      onContextMenu={(e) =>
        onCellContextMenu(e, taskId, date, hours, isSubmitted, contextClient)
      }
    >
      {isEditing ? (
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={hoursEditCell.editValue}
          onChange={(e) => hoursEditCell.handleCellChange(e.target.value)}
          onBlur={() => onCellBlur(taskId, date, hours, details)}
          onKeyDown={(e) => onKeyDown(e, taskId, date, dateIdx, hours, details)}
          onWheel={(e) => e.target.blur()}
          className="w-full h-full px-0.5 py-0.5 text-center text-xs border border-cyan-500 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      ) : (
        <div
          className={`relative flex items-center justify-center py-1 rounded ${
            hours > 0 ? "hover:bg-gray-100" : ""
          }`}
          onMouseEnter={(e) => {
            if (hours > 0 && details) onNoteTooltipHover(e, taskId, date, details);
          }}
          onMouseLeave={() => {
            if (hours > 0 && details) onNoteTooltipLeave();
          }}
        >
          {hours > 0 && details && (
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[5px] border-t-blue-600 border-r-[5px] border-r-transparent" />
          )}
          <span
            className={`text-[10px] font-semibold ${
              hours > 0 ? "text-gray-700" : "text-gray-300"
            }`}
          >
            {hours != null && hours > 0 ? hours.toFixed(1) : "-"}
          </span>
        </div>
      )}
    </td>
  );
});

export default TMPlanningCell;
