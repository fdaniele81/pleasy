import { useMemo } from 'react';
import { formatDateISO } from '../../../utils/date/dateUtils';

export const useTimeOffPlanCalculations = (users) => {

  const getTimeOffForDate = (user, timeOffTypeId, date) => {
    const dateStr = typeof date === 'string' ? date : formatDateISO(date);
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

  const getGrandTotal = (timeOffTypeId, usersList = users) => {
    let total = 0;
    usersList.forEach(user => {
      total += getTotalHoursForUserAndType(user, timeOffTypeId);
    });
    return total;
  };

  const getMonthlyBreakdown = useMemo(() => {
    const today = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
    }

    const userMonthTotals = new Map();

    if (users && users.length > 0) {
      users.forEach(user => {
        const monthTotals = new Map();
        user.timeOffs?.forEach(to => {
          if (to.time_off_type_id === 'VACATION') {
            const monthKey = to.date.substring(0, 7);
            if (months.includes(monthKey)) {
              monthTotals.set(monthKey, (monthTotals.get(monthKey) || 0) + to.hours);
            }
          }
        });
        userMonthTotals.set(user.user_id, monthTotals);
      });
    }

    return { months, userMonthTotals };
  }, [users]);

  return {
    getTimeOffForDate,
    getTotalHoursForUserAndType,
    getTotalHoursForUser,
    getGrandTotal,
    getMonthlyBreakdown,
  };
};
