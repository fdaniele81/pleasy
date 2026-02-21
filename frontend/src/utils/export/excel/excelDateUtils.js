export { isWeekend, isHoliday } from '../../date/workingDays';

export const generateDateRange = (startDate, endDate) => {
  const dateRange = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dateRange.push(new Date(date));
  }

  return dateRange;
};
