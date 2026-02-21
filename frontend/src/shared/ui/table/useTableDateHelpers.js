import { useMemo } from 'react';
import { isHoliday } from '../../../utils/date/workingDays';
import { formatDateISO } from '../../../utils/date/dateUtils';

function useTableDateHelpers(dateRange, holidays = []) {
  const todayISO = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return formatDateISO(today);
  }, []);

  const dateInfoMap = useMemo(() => {
    const map = new Map();

    dateRange.forEach((date) => {
      const isoDate = formatDateISO(date);
      const dayOfWeek = date.getDay();
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
      const holidayMatch = holidays.find((h) => {
        if (!h || !h.date) return false;
        const holidayDate = new Date(h.date);
        const holidayStr = formatDateISO(holidayDate);

        if (h.is_recurring) {
          return (
            date.getMonth() === holidayDate.getMonth() &&
            date.getDate() === holidayDate.getDate()
          );
        }
        return isoDate === holidayStr;
      });

      map.set(isoDate, {
        isoDate,
        isWeekend: isWeekendDay,
        isHoliday: !!holidayMatch,
        holidayName: holidayMatch?.name || '',
        isToday: isoDate === todayISO,
        day: date.getDate(),
        weekDay: ['D', 'L', 'M', 'M', 'G', 'V', 'S'][dayOfWeek],
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isNonWorking: isWeekendDay || !!holidayMatch,
      });
    });

    return map;
  }, [dateRange, holidays, todayISO]);

  const getDateInfo = (date) => {
    const isoDate = formatDateISO(date);
    return dateInfoMap.get(isoDate) || {
      isoDate,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false,
      holidayName: '',
      isToday: isoDate === todayISO,
      day: date.getDate(),
      weekDay: ['D', 'L', 'M', 'M', 'G', 'V', 'S'][date.getDay()],
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      isNonWorking: date.getDay() === 0 || date.getDay() === 6,
    };
  };

  const workingDaysCount = useMemo(() => {
    let count = 0;
    dateInfoMap.forEach((info) => {
      if (!info.isNonWorking) count++;
    });
    return count;
  }, [dateInfoMap]);

  const getHeaderBgClass = (date) => {
    const info = getDateInfo(date);
    if (info.isToday) return 'bg-yellow-500';
    if (info.isNonWorking) return 'bg-gray-500';
    return 'bg-cyan-700';
  };

  const getCellBgClass = (date, options = {}) => {
    const { isLocked = false, isSelected = false } = options;
    const info = getDateInfo(date);

    if (isSelected) return 'bg-cyan-200';
    if (isLocked) return 'bg-cyan-50';
    if (info.isToday) return 'bg-yellow-50';
    if (info.isNonWorking) return 'bg-gray-100';
    return '';
  };

  return {
    todayISO,
    getDateInfo,
    workingDaysCount,
    getHeaderBgClass,
    getCellBgClass,
    dateInfoMap,
  };
}

export default useTableDateHelpers;
