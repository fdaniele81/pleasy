import { useMemo } from 'react';
import { toISODate, formatDateISO } from '../../../utils/date/dateUtils';
import { getMonday } from '../../../utils/date/dateUtils';
import { getWeekCountForWidth } from '../../../constants/breakpoints';

export const useTimeOffPlanCalculations = (startDate, endDate, viewMode, users) => {

  const generateWeekRanges = useMemo(() => {
    if (viewMode !== 'weekly' || !startDate) return [];

    const maxWeeks = getWeekCountForWidth();
    const weeks = [];
    const firstWeekStart = getMonday(new Date(startDate));

    for (let i = 0; i < maxWeeks; i++) {
      const weekStart = new Date(firstWeekStart);
      weekStart.setDate(weekStart.getDate() + (i * 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const dates = [];
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      weeks.push({
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        dates: dates
      });
    }

    return weeks;
  }, [startDate, viewMode]);

  const getExtendedDateRange = () => {
    if (viewMode === 'weekly' && generateWeekRanges.length > 0) {
      const firstWeek = generateWeekRanges[0];
      const lastWeek = generateWeekRanges[generateWeekRanges.length - 1];
      return {
        start: toISODate(firstWeek.weekStart),
        end: toISODate(lastWeek.weekEnd)
      };
    }
    return { start: startDate, end: endDate };
  };

  const getWeekForDate = (date) => {
    if (viewMode !== 'weekly') return null;

    const dateStr = toISODate(date);
    return generateWeekRanges.find(week => {
      const weekStartStr = toISODate(week.weekStart);
      const weekEndStr = toISODate(week.weekEnd);
      return dateStr >= weekStartStr && dateStr <= weekEndStr;
    });
  };

  const formatWeekHeader = (weekStart, locale) => {
    const day = weekStart.getDate();
    const monthName = locale
      ? weekStart.toLocaleDateString(locale, { month: 'short' }).replace('.', '')
      : String(weekStart.getMonth() + 1);
    const year = weekStart.getFullYear();
    return { day, monthName, year };
  };

  const getTimeOffForDate = (user, timeOffTypeId, date) => {
    const dateStr = formatDateISO(date);
    const timeOff = user.timeOffs?.find(to => to.time_off_type_id === timeOffTypeId && to.date === dateStr);
    return timeOff ? timeOff.hours : 0;
  };

  const getTotalHoursForUserAndType = (user, timeOffTypeId) => {
    return user.timeOffs?.filter(to => to.time_off_type_id === timeOffTypeId)
      .reduce((sum, to) => sum + to.hours, 0) || 0;
  };

  const getTotalHoursForUser = (user) => {
    return user.timeOffs?.reduce((sum, to) => sum + to.hours, 0) || 0;
  };

  const getTotalHoursForDate = (date, timeOffTypeId, usersList = users) => {
    const dateStr = formatDateISO(date);
    let total = 0;

    usersList.forEach(user => {
      const to = user.timeOffs?.find(to => to.time_off_type_id === timeOffTypeId && to.date === dateStr);
      if (to) total += to.hours;
    });

    return total;
  };

  const getTimeOffForWeek = (user, timeOffTypeId, weekDates) => {
    let total = 0;
    weekDates.forEach(date => {
      const dateStr = formatDateISO(date);
      const timeOff = user.timeOffs?.find(to => to.time_off_type_id === timeOffTypeId && to.date === dateStr);
      if (timeOff) total += timeOff.hours;
    });
    return total;
  };

  const getTotalHoursForWeek = (weekDates, timeOffTypeId, usersList = users) => {
    let total = 0;
    usersList.forEach(user => {
      total += getTimeOffForWeek(user, timeOffTypeId, weekDates);
    });
    return total;
  };

  const getGrandTotal = (timeOffTypeId, usersList = users) => {
    let total = 0;
    usersList.forEach(user => {
      total += getTotalHoursForUserAndType(user, timeOffTypeId);
    });
    return total;
  };

  return {
    weekRanges: generateWeekRanges,
    getExtendedDateRange,
    getWeekForDate,
    formatWeekHeader,
    getTimeOffForDate,
    getTotalHoursForUserAndType,
    getTotalHoursForUser,
    getTotalHoursForDate,
    getTimeOffForWeek,
    getTotalHoursForWeek,
    getGrandTotal
  };
};
