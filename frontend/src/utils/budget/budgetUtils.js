export const getTotalHoursForTask = (task) => {
  return (task.total_hours_worked || 0) + (task.initial_actual || 0);
};

export const getBudgetRemaining = (task) => {
  const etc = task.etc_hours || 0;
  const nonSubmittedHours = task.user_non_submitted_hours || 0;
  return etc - nonSubmittedHours;
};

export const getBudgetColorStatus = (task) => {
  const actual = getTotalHoursForTask(task);
  const budget = task.budget || 0;

  if (budget === 0) {
    return actual > 0 ? 'red' : 'gray';
  }

  if (actual >= budget) return 'red';
  if (actual >= budget * 0.8) return 'orange';
  return 'gray';
};

export const getBudgetPercentage = (task) => {
  const actual = getTotalHoursForTask(task);
  const budget = task.budget || 0;

  if (budget === 0) return 0;
  return Math.min((actual / budget) * 100, 100);
};

export const formatHours = (hours, showInDays = false) => {
  if (hours === null || hours === undefined || isNaN(hours)) return '-';
  const value = showInDays ? hours / 8 : hours;
  return (Math.round(value * 10) / 10).toFixed(1);
};

export const getTotalHoursForTimeOffType = (timeOffTypeId, timeOffHistoricalTotals) => {
  const historicalTotal = timeOffHistoricalTotals?.find(
    (tot) => tot.time_off_type_id === timeOffTypeId
  );
  return historicalTotal?.total_hours || 0;
};

export const getTMTaskHours = (task) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let pastHours = 0;
  let futureHours = 0;

  if (task.timesheets) {
    for (const ts of task.timesheets) {
      const workDate = ts.work_date.split('T')[0];
      if (workDate < todayStr) {
        pastHours += ts.hours_worked || 0;
      } else {
        futureHours += ts.hours_worked || 0;
      }
    }
  }

  pastHours += task.initial_actual || 0;

  return {
    pastHours,
    futureHours,
    totalHours: pastHours + futureHours
  };
};
