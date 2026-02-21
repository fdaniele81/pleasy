import React, { memo } from 'react';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { toISODate } from '../../../utils/date/dateUtils';
import { isHoliday } from '../../../utils/date/workingDays';

const TimeOffPlanUserRow = memo(function TimeOffPlanUserRow({
  user,
  timeOffTypeId,
  isSelected,
  onToggleSelection,
  viewMode,
  dateRange,
  weekRanges,
  holidays,
  getTimeOffForDate,
  getTimeOffForWeek,
  getTotalHoursForUserAndType,
  bgColor = 'bg-cyan-50'
}) {
  return (
    <tr>
      <td className="border border-gray-300 px-1 py-1 text-center sticky left-0 bg-white z-10 w-8 min-w-8 max-w-8">
        <SelectionCheckbox
          checked={isSelected}
          onChange={() => onToggleSelection(user.user_id, timeOffTypeId)}
        />
      </td>

      <td className="border border-gray-300 px-4 py-2 sticky left-8 bg-white z-10 w-64 min-w-64 max-w-64 shadow-[2px_0_0_0_rgb(229,231,235)] text-sm">
        {user.full_name || user.email}
      </td>

      <td className="border border-gray-300 px-1 py-1 text-center font-bold bg-gray-100 sticky left-72 z-10 w-20 min-w-20 max-w-20 shadow-[4px_0_0_0_rgb(243,244,246)] text-xs">
        {getTotalHoursForUserAndType(user, timeOffTypeId).toFixed(1)}
      </td>

      {viewMode === 'daily' ? (
        dateRange.map((date, dateIdx) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isHolidayDay = isHoliday(date, holidays);
          const hours = getTimeOffForDate(user, timeOffTypeId, date);

          return (
            <td
              key={dateIdx}
              className={`border border-gray-300 px-1 py-1 text-center w-[45px] ${
                isHolidayDay || isWeekend
                  ? 'bg-gray-200'
                  : hours > 0
                    ? bgColor
                    : 'bg-white'
              }`}
            >
              <span className={`text-xs ${hours > 0 ? 'font-semibold text-cyan-700' : 'text-gray-400'}`}>
                {hours > 0 ? hours.toFixed(1) : '-'}
              </span>
            </td>
          );
        })
      ) : (
        weekRanges.map((week, idx) => {
          const hours = getTimeOffForWeek(user, timeOffTypeId, week.dates);

          return (
            <td
              key={idx}
              className={`border border-gray-300 px-1 py-1 text-center w-12 ${hours > 0 ? bgColor : 'bg-white'}`}
            >
              <span className={`text-xs ${hours > 0 ? 'font-semibold text-cyan-700' : 'text-gray-400'}`}>
                {hours > 0 ? hours.toFixed(1) : '-'}
              </span>
            </td>
          );
        })
      )}
    </tr>
  );
});

export default TimeOffPlanUserRow;
