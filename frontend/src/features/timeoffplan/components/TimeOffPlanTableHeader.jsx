import React from 'react';
import { useTranslation } from 'react-i18next';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { formatHeaderDate } from '../../../utils/table/tableUtils';
import { isHoliday } from '../../../utils/date/workingDays';
import { toISODate } from '../../../utils/date/dateUtils';
import { useLocale } from '../../../hooks/useLocale';

const TimeOffPlanTableHeader = ({
  viewMode,
  dateRange,
  weekRanges,
  holidays,
  formatWeekHeader,
  filteredUsers,
  selectedUsers,
  onSelectAll
}) => {
  const { t } = useTranslation(['timeoffplan', 'common']);
  const locale = useLocale();
  return (
    <thead>
      <tr className="bg-cyan-700 text-white">
        <th className="border border-gray-300 px-1 py-1 text-center font-semibold sticky left-0 bg-cyan-700 z-20 w-8 min-w-8 max-w-8">
          <SelectionCheckbox
            onChange={(e) => {
              const allUserIds = filteredUsers.map((u) => u.user_id);
              const newSelected = { VACATION: {}, OTHER: {} };
              if (e.target.checked) {
                allUserIds.forEach((id) => {
                  newSelected.VACATION[id] = true;
                  newSelected.OTHER[id] = true;
                });
              }
              onSelectAll(newSelected);
            }}
            checked={
              filteredUsers.length > 0 &&
              filteredUsers.every((u) =>
                selectedUsers.VACATION?.[u.user_id] && selectedUsers.OTHER?.[u.user_id]
              )
            }
          />
        </th>

        <th className="border border-gray-300 px-4 py-2 text-left font-semibold sticky left-8 bg-cyan-700 z-20 w-64 min-w-64 max-w-64 shadow-[2px_0_0_0_rgb(79,70,229)]">
          {t('timeoffplan:userHeader')}
        </th>

        <th className="border border-gray-300 px-1 py-1 text-center font-semibold sticky left-72 bg-cyan-700 z-20 w-20 min-w-20 max-w-20 shadow-[4px_0_0_0_rgb(79,70,229)] text-xs">
          {t('timeoffplan:totalShort')}
        </th>

        {viewMode === 'daily' ? (
          dateRange.map((date, idx) => {
            const dayName = date.toLocaleDateString(locale, { weekday: 'short' }).substring(0, 3);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHolidayDay = isHoliday(date, holidays);
            const { day } = formatHeaderDate(date);
            const monthName = date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = toISODate(date) === toISODate(today);

            return (
              <th
                key={idx}
                className={`border border-gray-300 px-1 py-1 text-center font-semibold text-xs w-[45px] ${
                  isToday
                    ? 'bg-cyan-600 text-white'
                    : isHolidayDay || isWeekend
                    ? 'bg-gray-600 text-white'
                    : 'bg-cyan-700 text-white'
                }`}
                title={
                  isHolidayDay
                    ? (holidays.find((h) => {
                        if (!h || !h.date) return false;
                        const holidayDate = new Date(h.date);
                        const dateStr = toISODate(date);
                        const holidayStr = toISODate(holidayDate);

                        if (h.is_recurring) {
                          return date.getMonth() === holidayDate.getMonth() &&
                                 date.getDate() === holidayDate.getDate();
                        } else {
                          return dateStr === holidayStr;
                        }
                      })?.name || t('timeoffplan:holidays'))
                    : isToday
                    ? t('timeoffplan:today')
                    : ''
                }
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] font-normal">{dayName}</span>
                  <span className="font-bold">{day}</span>
                  <span className="text-[10px] font-normal">{monthName}</span>
                </div>
              </th>
            );
          })
        ) : (
          weekRanges.map((week, idx) => {
            const { day, monthName, year } = formatWeekHeader(week.weekStart, locale);
            return (
              <th
                key={idx}
                className="border border-gray-300 px-1 py-1 text-center font-semibold bg-cyan-700 text-white text-xs w-12"
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] font-normal">{t('timeoffplan:weekShort')}</span>
                  <span className="font-bold">{day}/{monthName}</span>
                  <span className="text-[10px] font-normal">{year}</span>
                </div>
              </th>
            );
          })
        )}
      </tr>
    </thead>
  );
};

export default TimeOffPlanTableHeader;
