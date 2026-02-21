import React from 'react';
import { useTranslation } from 'react-i18next';
import { isHoliday } from '../../../utils/date/workingDays';

const TimeOffPlanTotalsRow = ({
  timeOffTypeId,
  viewMode,
  dateRange,
  weekRanges,
  holidays,
  getTotalHoursForDate,
  getTotalHoursForWeek,
  getGrandTotal,
  usersList,
  bgColor = 'bg-cyan-100'
}) => {
  const { t } = useTranslation(['common']);
  return (
    <tr className={`font-bold ${bgColor}`}>
      <td className={`border border-gray-300 px-1 py-1 sticky left-0 ${bgColor} z-10 w-8 min-w-8 max-w-8`}></td>
      <td className={`border border-gray-300 px-4 py-2 sticky left-8 ${bgColor} z-10 w-64 min-w-64 max-w-64 shadow-[2px_0_0_0_rgb(224,231,255)] text-cyan-900`}>
        {t('common:total')}
      </td>
      <td className={`border border-gray-300 px-1 py-1 text-center bg-cyan-200 sticky left-72 z-10 w-20 min-w-20 max-w-20 shadow-[4px_0_0_0_rgb(224,231,255)] text-cyan-900 text-xs font-bold`}>
        {getGrandTotal(timeOffTypeId, usersList).toFixed(1)}
      </td>

      {viewMode === 'daily' ? (
        dateRange.map((date, idx) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isHolidayDay = isHoliday(date, holidays);
          const total = getTotalHoursForDate(date, timeOffTypeId, usersList);

          return (
            <td
              key={idx}
              className={`border border-gray-300 px-1 py-1 text-center w-[45px] ${
                isHolidayDay || isWeekend ? 'bg-cyan-200' : bgColor
              }`}
            >
              <span className="text-xs text-cyan-900 font-bold">
                {total > 0 ? total.toFixed(1) : '-'}
              </span>
            </td>
          );
        })
      ) : (
        weekRanges.map((week, idx) => {
          const total = getTotalHoursForWeek(week.dates, timeOffTypeId, usersList);

          return (
            <td
              key={idx}
              className={`border border-gray-300 px-1 py-1 text-center w-12 ${bgColor}`}
            >
              <span className="text-xs text-cyan-900 font-bold">
                {total > 0 ? total.toFixed(1) : '-'}
              </span>
            </td>
          );
        })
      )}
    </tr>
  );
};

export default TimeOffPlanTotalsRow;
