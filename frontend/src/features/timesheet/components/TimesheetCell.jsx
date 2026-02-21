import React, { memo } from "react";
import { Pencil } from "lucide-react";
import { formatDateLocal } from "../../../utils/table/tableUtils";

const TimesheetCell = memo(function TimesheetCell({
  taskId,
  date,
  dateIdx,
  hours,
  isSubmitted,
  timesheetId,
  details,
  isWeekend,
  isHoliday,
  isToday,
  editingCell,
  editValue,
  topBorderClass = "",
  onCellClick,
  onCellContextMenu,
  onCellBlur,
  onKeyDown,
  onEditValueChange,
  onNoteTooltipHover,
  onNoteTooltipLeave,
}) {
  const dateStr = formatDateLocal(date);
  const cellKey = `${taskId}-${dateStr}`;
  const isEditing = editingCell === cellKey;

  const isCellLocked = isSubmitted && hours > 0;

  return (
    <td
      className={`border-b border-r border-gray-300 px-1 py-1 text-center w-[45px] ${
        isToday ? "bg-cyan-50" : isHoliday || isWeekend ? "bg-gray-200" : ""
      } ${
        isCellLocked ? "bg-cyan-50" : ""
      } ${topBorderClass}`}
      onClick={() =>
        !isEditing &&
        onCellClick(
          taskId,
          date,
          hours,
          isSubmitted
        )
      }
      onContextMenu={(e) =>
        !isEditing &&
        onCellContextMenu &&
        onCellContextMenu(
          e,
          taskId,
          date,
          hours,
          isSubmitted
        )
      }
    >
      {isEditing ? (
        <input
          type="number"
          step="0.5"
          min="0"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={() => onCellBlur(taskId, date, hours, timesheetId)}
          onKeyDown={(e) =>
            onKeyDown(
              e,
              taskId,
              date,
              dateIdx,
              hours,
              timesheetId
            )
          }
          onWheel={(e) => e.target.blur()}
          className="w-full text-center border-2 border-blue-500 rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      ) : (
        <div
          className={`relative flex items-center justify-center cursor-pointer group`}
          onMouseEnter={(e) => {
            if (hours > 0 && details && onNoteTooltipHover) {
              onNoteTooltipHover(e, taskId, date, details, 'task');
            }
          }}
          onMouseLeave={() => {
            if (hours > 0 && details && onNoteTooltipLeave) {
              onNoteTooltipLeave();
            }
          }}
        >
          {hours > 0 && details && (
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[6px] border-t-blue-600 border-r-[6px] border-r-transparent" />
          )}

          <span
            className={`text-xs ${
              hours > 0
                ? "font-semibold"
                : "text-gray-400"
            } ${
              isCellLocked
                ? "text-blue-600"
                : ""
            }`}
          >
            {hours > 0 ? hours.toFixed(1) : "-"}
          </span>
          {hours > 0 && (
            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2" />
          )}
        </div>
      )}
    </td>
  );
});

export default TimesheetCell;
