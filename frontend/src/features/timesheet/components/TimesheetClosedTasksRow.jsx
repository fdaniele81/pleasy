import React, { memo } from "react";
import { useTranslation } from 'react-i18next';
import { Archive } from "lucide-react";
import { isHoliday } from "../../../utils/date/workingDays";
import { toISODate } from "../../../utils/date/dateUtils";

const TimesheetClosedTasksRow = memo(function TimesheetClosedTasksRow({
  dateRange,
  holidays,
  getClosedTasksHoursForDate,
  getClosedTasksGrandTotal,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  return (
    <tr className="bg-purple-50 border-t-2 border-purple-300">
      <td className="border-b border-r border-gray-300 px-1 py-1 text-center sticky left-0 bg-purple-50 z-10 w-8 min-w-8 max-w-8">
        <div className="w-4 h-4"></div>
      </td>

      <td className="xl:hidden border-b border-r border-gray-300 px-2 py-1 sticky left-8 bg-purple-50 z-10 shadow-[2px_0_0_0_rgb(192,132,252)]" colSpan="2">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-purple-600" />
          <div className="font-medium text-xs text-purple-700">
            {t('timesheet:closedTasksTimesheets')}
          </div>
        </div>
      </td>
      <td className="hidden xl:table-cell border-b border-r border-gray-300 px-2 py-1 sticky left-8 bg-purple-50 z-10 shadow-[2px_0_0_0_rgb(192,132,252)]" colSpan="3">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-purple-600" />
          <div className="font-medium text-xs text-purple-700">
            {t('timesheet:closedTasksTimesheets')}
          </div>
        </div>
      </td>

      <td className="border-b border-r border-gray-300 px-1 py-1 text-center font-bold text-purple-700 bg-purple-50 sticky left-68 xl:left-112 z-10 w-20 min-w-20 max-w-20 text-xs">
        {getClosedTasksGrandTotal().toFixed(1)}
      </td>

      {dateRange.map((date, dateIdx) => {
        const hours = getClosedTasksHoursForDate(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHolidayDay = isHoliday(date, holidays);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = toISODate(date) === toISODate(today);

        return (
          <td
            key={dateIdx}
            className={`border-b border-r border-gray-300 px-1 py-1 text-center w-[45px] ${
              isToday
                ? "bg-cyan-50"
                : isHolidayDay || isWeekend
                ? "bg-gray-100"
                : "bg-purple-50"
            }`}
          >
            <span
              className={`text-xs ${
                hours > 0
                  ? "font-semibold text-purple-700"
                  : "text-gray-400"
              }`}
            >
              {hours > 0 ? hours.toFixed(1) : "-"}
            </span>
          </td>
        );
      })}
    </tr>
  );
});

export default TimesheetClosedTasksRow;
