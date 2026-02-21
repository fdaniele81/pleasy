import React, { memo } from "react";
import { useTranslation } from 'react-i18next';
import { Pencil, ExternalLink } from "lucide-react";
import { SelectionCheckbox } from "../../../shared/ui/table";
import { getTotalHoursForTimeOffType } from "../../../utils/budget/budgetUtils";
import { getTimeOffForDate, formatDateLocal } from "../../../utils/table/tableUtils";
import { isHoliday } from "../../../utils/date/workingDays";
import { TimesheetTimeOffConfig } from "../../../utils/ui/timeOffIcons";

const TimesheetTimeOffRow = memo(function TimesheetTimeOffRow({
  timeOffType,
  dateRange,
  timeOffs,
  timeOffHistoricalTotals,
  holidays,
  selectedTasks,
  editingCell,
  editValue,
  onTaskSelection,
  onTimeOffCellClick,
  onTimeOffCellContextMenu,
  onTimeOffCellBlur,
  onTimeOffKeyDown,
  onEditValueChange,
  onNoteTooltipHover,
  onNoteTooltipLeave,
  onTotalClick,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const config = TimesheetTimeOffConfig[timeOffType];
  const { icon: Icon, label, bgColor, borderColor, textColor, inputBorderColor, shadowColor } = config;
  const isVacation = timeOffType === "VACATION";

  return (
    <tr className={`${bgColor} border-t${isVacation ? '-2' : ''} ${borderColor}`}>
      <td className={`border-b border-r border-gray-300 px-1 py-1 text-center sticky left-0 ${bgColor} z-10 w-8 min-w-8 max-w-8`}>
        <SelectionCheckbox
          checked={!!selectedTasks[`timeoff-${timeOffType}`]}
          onChange={() => onTaskSelection(`timeoff-${timeOffType}`)}
        />
      </td>

      <td className={`xl:hidden border-b border-r border-gray-300 px-2 py-1 sticky left-8 ${bgColor} z-10 ${shadowColor}`} colSpan="2">
        <div className="flex items-center gap-2">
          <Icon size={18} className={textColor} />
          <div className={`font-medium text-xs ${textColor}`}>
            {label}
          </div>
        </div>
      </td>
      <td className={`hidden xl:table-cell border-b border-r border-gray-300 px-2 py-1 sticky left-8 ${bgColor} z-10 ${shadowColor}`} colSpan="3">
        <div className="flex items-center gap-2">
          <Icon size={18} className={textColor} />
          <div className={`font-medium text-xs ${textColor}`}>
            {label}
          </div>
        </div>
      </td>

      <td className={`border-b border-r border-gray-300 px-1 py-1 text-center ${bgColor} sticky left-68 xl:left-112 z-10 w-20 min-w-20 max-w-20`}>
        <button
          onClick={() => onTotalClick && onTotalClick(timeOffType)}
          className={`flex items-center justify-center gap-1 w-full ${textColor} hover:underline text-xs font-medium transition-colors`}
        >
          <span>{t('common:details')}</span>
          <ExternalLink size={12} />
        </button>
      </td>

      {dateRange.map((date, dateIdx) => {
        const hours = getTimeOffForDate(timeOffType, date, timeOffs);
        const dateStr = formatDateLocal(date);
        const cellKey = `timeoff-${timeOffType}-${dateStr}`;
        const isEditing = editingCell === cellKey;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHolidayDay = isHoliday(date, holidays);
        const isDisabled = isWeekend || isHolidayDay;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateNormalized = new Date(date);
        dateNormalized.setHours(0, 0, 0, 0);
        const isToday = dateNormalized.getTime() === today.getTime();

        return (
          <td
            key={dateIdx}
            className={`border-b border-r border-gray-300 px-1 py-1 text-center w-[45px] ${
              isToday
                ? "bg-cyan-50"
                : isHolidayDay || isWeekend
                ? "bg-gray-100"
                : bgColor
            } ${isDisabled ? "cursor-not-allowed" : ""}`}
            onClick={() =>
              !isEditing &&
              !isDisabled &&
              onTimeOffCellClick(
                timeOffType,
                date,
                hours
              )
            }
            onContextMenu={(e) =>
              !isEditing &&
              !isDisabled &&
              onTimeOffCellContextMenu &&
              onTimeOffCellContextMenu(
                e,
                timeOffType,
                date,
                hours
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
                onBlur={() =>
                  onTimeOffCellBlur(
                    timeOffType,
                    date,
                    hours
                  )
                }
                onKeyDown={(e) =>
                  onTimeOffKeyDown(
                    e,
                    timeOffType,
                    date,
                    dateIdx,
                    hours
                  )
                }
                onWheel={(e) => e.target.blur()}
                className={`w-full text-center border-2 ${inputBorderColor} rounded px-1 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                autoFocus
              />
            ) : (
              <div
                className={`relative flex items-center justify-center ${
                  isDisabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } group`}
                onMouseEnter={(e) => {
                  if (hours > 0 && !isDisabled) {
                    const timeOffEntry = timeOffs.find(
                      to => to.time_off_type_id === timeOffType && to.date === dateStr
                    );
                    if (timeOffEntry?.details && onNoteTooltipHover) {
                      onNoteTooltipHover(e, timeOffType, date, timeOffEntry.details, 'timeoff');
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (hours > 0 && !isDisabled && onNoteTooltipLeave) {
                    onNoteTooltipLeave();
                  }
                }}
              >
                {hours > 0 && (() => {
                  const timeOffEntry = timeOffs.find(
                    to => to.time_off_type_id === timeOffType && to.date === dateStr
                  );
                  const triangleColor = timeOffType === 'VACATION' ? 'border-t-green-600' : 'border-t-yellow-500';
                  return timeOffEntry?.details ? (
                    <div className={`absolute top-0 left-0 w-0 h-0 border-t-[6px] ${triangleColor} border-r-[6px] border-r-transparent`} />
                  ) : null;
                })()}

                <span
                  className={`text-xs ${
                    hours > 0
                      ? `font-semibold ${isVacation ? 'text-green-700' : 'text-yellow-700'}`
                      : "text-gray-400"
                  }`}
                >
                  {hours > 0 ? hours.toFixed(1) : "-"}
                </span>

                {hours > 0 && !isDisabled && (
                  <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2" />
                )}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
});

export default TimesheetTimeOffRow;
