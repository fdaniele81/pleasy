import { differenceInDays, getMonthAbbr, endOfMonth } from '../../../../utils/date/dateUtils';
import { COLUMN_GAP, MIN_COLUMN_WIDTH } from './ganttCalculations';
import i18n from '../../../../i18n/i18n';

export function generateAdaptiveTimeline(startDate, endDate, pixelsPerDay, granularity, leftMargin, anonymizeMode = false, anonLabels = null) {
  const labels = anonLabels || { week: 'Sett.', month: 'Mese', months: 'Mesi' };
  if (anonymizeMode) {
    switch (granularity) {
      case 'days':
      case 'weeks':
        return generateAnonymousWeeksTimeline(startDate, endDate, pixelsPerDay, leftMargin, labels);
      case 'months':
      case 'quarters':
      case 'years':
        return generateAnonymousMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin, labels);
      default:
        return generateAnonymousMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin, labels);
    }
  }

  switch (granularity) {
    case 'days':
      return generateDaysTimeline(startDate, endDate, pixelsPerDay, leftMargin);
    case 'weeks':
      return generateWeeksTimeline(startDate, endDate, pixelsPerDay, leftMargin);
    case 'months':
      return generateMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin);
    case 'quarters':
      return generateQuartersTimeline(startDate, endDate, pixelsPerDay, leftMargin);
    case 'years':
      return generateYearsTimeline(startDate, endDate, pixelsPerDay, leftMargin);
    default:
      return generateMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin);
  }
}

export function generateDaysTimeline(startDate, endDate, pixelsPerDay, leftMargin) {
  const segments = [];
  let currentX = leftMargin;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const width = pixelsPerDay;

    segments.push({
      label: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
      x: currentX,
      width: width - COLUMN_GAP
    });

    currentX += width;
    current.setDate(current.getDate() + 1);
  }

  return segments;
}

export function generateWeeksTimeline(startDate, endDate, pixelsPerDay, leftMargin) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);

  let weekNumber = 1;

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const visibleStart = weekStart < startDate ? startDate : weekStart;
    const visibleEnd = weekEnd > endDate ? endDate : weekEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    segments.push({
      label: `${i18n.t('common:weekShort')}${weekNumber}`,
      x: currentX,
      width: width - COLUMN_GAP
    });

    currentX += width;
    current.setDate(current.getDate() + 7);
    weekNumber++;
  }

  return segments;
}

export function generateMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  current.setDate(1);

  let groupStart = null;
  let groupWidth = 0;
  let groupMonths = [];

  while (current <= endDate) {
    const monthStart = new Date(current);
    const monthEnd = endOfMonth(monthStart);

    const visibleStart = monthStart < startDate ? startDate : monthStart;
    const visibleEnd = monthEnd > endDate ? endDate : monthEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    if (groupStart === null) {
      groupStart = monthStart;
      groupWidth = width;
      groupMonths = [monthStart];
    } else {
      groupWidth += width;
      groupMonths.push(monthStart);
    }

    current.setMonth(current.getMonth() + 1);

    const isLast = current > endDate;
    if (groupWidth >= MIN_COLUMN_WIDTH || isLast) {
      let label;
      if (groupMonths.length === 1) {
        label = `${getMonthAbbr(groupMonths[0])} ${groupMonths[0].getFullYear()}`;
      } else {
        const firstMonth = groupMonths[0];
        const lastMonth = groupMonths[groupMonths.length - 1];
        const firstAbbr = getMonthAbbr(firstMonth).toUpperCase();
        const lastAbbr = getMonthAbbr(lastMonth).toUpperCase();

        if (firstMonth.getFullYear() === lastMonth.getFullYear()) {
          label = `${firstAbbr}-${lastAbbr} ${firstMonth.getFullYear()}`;
        } else {
          label = `${firstAbbr} ${firstMonth.getFullYear()} - ${lastAbbr} ${lastMonth.getFullYear()}`;
        }
      }

      const segmentWidth = Math.max(MIN_COLUMN_WIDTH, groupWidth - COLUMN_GAP);
      segments.push({
        label,
        x: currentX,
        width: segmentWidth
      });

      currentX += segmentWidth + COLUMN_GAP;
      groupStart = null;
      groupWidth = 0;
      groupMonths = [];
    }
  }

  return segments;
}

export function generateQuartersTimeline(startDate, endDate, pixelsPerDay, leftMargin) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  const month = current.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3;
  current.setMonth(quarterMonth);
  current.setDate(1);

  let groupStart = null;
  let groupWidth = 0;
  let groupQuarters = [];

  while (current <= endDate) {
    const quarterStart = new Date(current);
    const quarterEnd = new Date(current);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);
    quarterEnd.setDate(0);

    const visibleStart = quarterStart < startDate ? startDate : quarterStart;
    const visibleEnd = quarterEnd > endDate ? endDate : quarterEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
    const year = quarterStart.getFullYear();

    if (groupStart === null) {
      groupStart = quarterStart;
      groupWidth = width;
      groupQuarters = [{ quarter, year }];
    } else {
      groupWidth += width;
      groupQuarters.push({ quarter, year });
    }

    current.setMonth(current.getMonth() + 3);

    const isLast = current > endDate;
    if (groupWidth >= MIN_COLUMN_WIDTH || isLast) {
      let label;
      if (groupQuarters.length === 1) {
        const q = groupQuarters[0];
        label = `Q${q.quarter} ${q.year}`;
      } else {
        const first = groupQuarters[0];
        const last = groupQuarters[groupQuarters.length - 1];

        if (first.year === last.year) {
          label = `Q${first.quarter}-Q${last.quarter} ${first.year}`;
        } else {
          label = `Q${first.quarter} ${first.year} - Q${last.quarter} ${last.year}`;
        }
      }

      const segmentWidth = Math.max(MIN_COLUMN_WIDTH, groupWidth - COLUMN_GAP);
      segments.push({
        label,
        x: currentX,
        width: segmentWidth
      });

      currentX += segmentWidth + COLUMN_GAP;
      groupStart = null;
      groupWidth = 0;
      groupQuarters = [];
    }
  }

  return segments;
}

export function generateYearsTimeline(startDate, endDate, pixelsPerDay, leftMargin) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  current.setMonth(0);
  current.setDate(1);

  while (current <= endDate) {
    const yearStart = new Date(current);
    const yearEnd = new Date(current.getFullYear(), 11, 31);

    const visibleStart = yearStart < startDate ? startDate : yearStart;
    const visibleEnd = yearEnd > endDate ? endDate : yearEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    segments.push({
      label: `${yearStart.getFullYear()}`,
      x: currentX,
      width: width - COLUMN_GAP
    });

    currentX += width;
    current.setFullYear(current.getFullYear() + 1);
  }

  return segments;
}

export function generateAnonymousWeeksTimeline(startDate, endDate, pixelsPerDay, leftMargin, labels = { week: 'Sett.' }) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);

  let weekNumber = 1;

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const visibleStart = weekStart < startDate ? startDate : weekStart;
    const visibleEnd = weekEnd > endDate ? endDate : weekEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    segments.push({
      label: `${labels.week} ${weekNumber}`,
      x: currentX,
      width: width - COLUMN_GAP
    });

    currentX += width;
    current.setDate(current.getDate() + 7);
    weekNumber++;
  }

  return segments;
}

export function generateAnonymousMonthsTimeline(startDate, endDate, pixelsPerDay, leftMargin, labels = { month: 'Mese', months: 'Mesi' }) {
  const segments = [];
  let currentX = leftMargin;

  const current = new Date(startDate);
  current.setDate(1);

  let monthNumber = 1;
  let groupStart = null;
  let groupWidth = 0;
  let groupMonthsCount = 0;
  let groupStartNumber = 1;

  while (current <= endDate) {
    const monthStart = new Date(current);
    const monthEnd = endOfMonth(monthStart);

    const visibleStart = monthStart < startDate ? startDate : monthStart;
    const visibleEnd = monthEnd > endDate ? endDate : monthEnd;
    const visibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const width = visibleDays * pixelsPerDay;

    if (groupStart === null) {
      groupStart = monthStart;
      groupWidth = width;
      groupMonthsCount = 1;
      groupStartNumber = monthNumber;
    } else {
      groupWidth += width;
      groupMonthsCount++;
    }

    current.setMonth(current.getMonth() + 1);
    const isLast = current > endDate;

    if (groupWidth >= MIN_COLUMN_WIDTH || isLast) {
      let label;
      if (groupMonthsCount === 1) {
        label = `${labels.month} ${groupStartNumber}`;
      } else {
        label = `${labels.months} ${groupStartNumber}-${monthNumber}`;
      }

      const segmentWidth = Math.max(MIN_COLUMN_WIDTH, groupWidth - COLUMN_GAP);
      segments.push({
        label,
        x: currentX,
        width: segmentWidth
      });

      currentX += segmentWidth + COLUMN_GAP;
      groupStart = null;
      groupWidth = 0;
      groupMonthsCount = 0;
    }

    monthNumber++;
  }

  return segments;
}
