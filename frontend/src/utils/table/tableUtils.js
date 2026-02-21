import { formatDateISO, parseISOLocal } from '../date/dateUtils';

export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = typeof startDate === 'string' ? parseISOLocal(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? parseISOLocal(endDate) : new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date));
  }

  return dates;
};

export const formatHeaderDate = (date) => {
  const day = date.getDate();
  const weekDay = ['D', 'L', 'M', 'M', 'G', 'V', 'S'][date.getDay()];
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return { day, weekDay, month, year };
};

export const formatDateLocal = (date) => {
  return formatDateISO(date);
};

export const getTimesheetForDate = (task, date) => {
  const dateStr = formatDateLocal(date);
  const timesheet = task.timesheets?.find(
    (ts) => ts.work_date.split('T')[0] === dateStr
  );
  return {
    hours: timesheet ? timesheet.hours_worked : 0,
    isSubmitted: timesheet ? timesheet.is_submitted : false,
    timesheetId: timesheet ? timesheet.timesheet_id : null,
    details: timesheet ? timesheet.details : null,
  };
};

export const getTimeOffForDate = (timeOffTypeId, date, timeOffs) => {
  const dateStr = formatDateLocal(date);
  const timeOff = timeOffs?.find(
    (to) => to.time_off_type_id === timeOffTypeId && to.date === dateStr
  );
  return timeOff ? timeOff.hours : 0;
};
