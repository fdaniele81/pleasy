export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isHoliday = (date, holidays = []) => {
  const dateString = date.toISOString().split('T')[0];

  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    const holidayString = holidayDate.toISOString().split('T')[0];

    if (holiday.is_recurring) {
      return (
        date.getMonth() === holidayDate.getMonth() &&
        date.getDate() === holidayDate.getDate()
      );
    }

    return dateString === holidayString;
  });
};

export const isWorkingDay = (date, holidays = []) => {
  return !isWeekend(date) && !isHoliday(date, holidays);
};

export const calculateWorkingDays = (startDate, endDate, holidays = []) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Date non valide');
  }

  if (start > end) {
    throw new Error('La data di inizio deve essere precedente alla data di fine');
  }

  let workingDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    if (isWorkingDay(currentDate, holidays)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

export const addWorkingDays = (startDate, workingDaysToAdd, holidays = []) => {
  const date = new Date(startDate);

  if (isNaN(date.getTime())) {
    throw new Error('Data non valida');
  }

  if (workingDaysToAdd < 0) {
    throw new Error('Il numero di giorni lavorativi deve essere positivo');
  }

  let daysAdded = 0;

  while (daysAdded < workingDaysToAdd) {
    date.setDate(date.getDate() + 1);

    if (isWorkingDay(date, holidays)) {
      daysAdded++;
    }
  }

  return date;
};

export const getWorkingDates = (startDate, endDate, holidays = []) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Date non valide');
  }

  if (start > end) {
    throw new Error('La data di inizio deve essere precedente alla data di fine');
  }

  const workingDates = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    if (isWorkingDay(currentDate, holidays)) {
      workingDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDates;
};

export const filterHolidaysByCompany = (holidays, companyId) => {
  return holidays.filter(
    holiday => !holiday.company_id || holiday.company_id === companyId
  );
};

export const formatDateIT = (date, locale) => {
  const d = new Date(date);
  return d.toLocaleDateString(locale || 'it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const calculateWorkingDaysProgress = (
  startDate,
  endDate,
  currentDate = new Date(),
  holidays = []
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(currentDate);

  if (current < start) return 0;
  if (current > end) return 100;

  const totalWorkingDays = calculateWorkingDays(start, end, holidays);
  const completedWorkingDays = calculateWorkingDays(start, current, holidays);

  if (totalWorkingDays === 0) return 0;

  return Math.round((completedWorkingDays / totalWorkingDays) * 100);
};
