import { formatDateISO } from '../../../utils/date/dateUtils';

/**
 * Computes sparse header segments for the timeline.
 * Each segment: { label, colSpan, containsToday }
 *
 * - 2 weeks: each day (colSpan=1)
 * - 1 month / 3 months: weekly groups (colSpan~7)
 * - 6 months / 12 months: monthly groups (colSpan~30)
 */
export function computeHeaderSegments(dateRange, timeInterval, locale = 'it-IT') {
  if (!dateRange || dateRange.length === 0) return [];

  const todayISO = formatDateISO(new Date());

  if (timeInterval <= 2) {
    return dateRange.map((date, idx) => ({
      label: formatDayLabel(date, locale),
      colSpan: 1,
      startIdx: idx,
      containsToday: formatDateISO(date) === todayISO,
    }));
  }

  if (timeInterval <= 13) {
    return groupByWeek(dateRange, locale, todayISO);
  }

  return groupByMonth(dateRange, locale, todayISO, timeInterval);
}

function formatDayLabel(date, locale) {
  const day = date.getDate();
  const weekDay = date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2);
  return `${weekDay} ${day}`;
}

function getISOWeekKey(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return formatDateISO(monday);
}

function groupByWeek(dateRange, locale, todayISO) {
  const segments = [];
  let current = null;

  dateRange.forEach((date, idx) => {
    const weekKey = getISOWeekKey(date);

    if (!current || current.weekKey !== weekKey) {
      if (current) segments.push(current);
      current = {
        weekKey,
        label: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        colSpan: 1,
        startIdx: idx,
        containsToday: formatDateISO(date) === todayISO,
      };
    } else {
      current.colSpan++;
      if (formatDateISO(date) === todayISO) current.containsToday = true;
    }
  });

  if (current) segments.push(current);
  return segments;
}

function groupByMonth(dateRange, locale, todayISO, timeInterval) {
  const segments = [];
  let current = null;

  dateRange.forEach((date, idx) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (!current || current.monthKey !== monthKey) {
      if (current) segments.push(current);
      const showYear = timeInterval >= 52;
      current = {
        monthKey,
        label: showYear
          ? date.toLocaleDateString(locale, { month: 'short', year: '2-digit' })
          : date.toLocaleDateString(locale, { month: 'short' }),
        colSpan: 1,
        startIdx: idx,
        containsToday: formatDateISO(date) === todayISO,
      };
    } else {
      current.colSpan++;
      if (formatDateISO(date) === todayISO) current.containsToday = true;
    }
  });

  if (current) segments.push(current);
  return segments;
}

/**
 * Computes month boundary markers for Jira-style timeline header.
 * Returns [{ label, pixelOffset, daysInRange }] — one entry per month boundary in the range.
 * daysInRange indicates how many days of that month are visible.
 */
export function computeMonthMarkers(dateRange, pixelsPerDay, locale = 'it-IT') {
  if (!dateRange || dateRange.length === 0) return [];

  const markers = [];
  let currentMonth = -1;
  let currentYear = -1;

  dateRange.forEach((date, idx) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    if (month !== currentMonth || year !== currentYear) {
      currentMonth = month;
      currentYear = year;
      markers.push({
        label: date.toLocaleDateString(locale, { month: 'short' }),
        pixelOffset: idx * pixelsPerDay,
        startIdx: idx,
      });
    }
  });

  // Compute daysInRange for each marker
  for (let i = 0; i < markers.length; i++) {
    const nextStartIdx = i + 1 < markers.length ? markers[i + 1].startIdx : dateRange.length;
    markers[i].daysInRange = nextStartIdx - markers[i].startIdx;
    delete markers[i].startIdx;
  }

  return markers;
}
