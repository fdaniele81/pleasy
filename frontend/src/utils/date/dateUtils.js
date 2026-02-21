import logger from '../logger';
import i18n from '../../i18n/i18n';

export { isWorkingDay, isWeekend, isHoliday, calculateWorkingDays, getWorkingDates } from './workingDays';

export const LOCALE_MAP = {
  it: 'it-IT',
  en: 'en-GB',
};

export const getLocale = () => LOCALE_MAP[i18n.language] || 'it-IT';

export const toISODate = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

export const parseISODate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString);
};

export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    logger.error('Date non valide in generateDateRange');
    return dates;
  }

  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const getAdaptiveDaysCount = (windowWidth = window.innerWidth) => {
  const { getColumnCountForWidth } = require('../constants/breakpoints');
  return getColumnCountForWidth(windowWidth);
};

export const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const differenceInDays = (endDate, startDate) => {
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDateISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISOLocal = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getMonthAbbr = (date, locale) => {
  const loc = locale || getLocale();
  return date.toLocaleDateString(loc, { month: 'short' }).replace('.', '').toUpperCase();
};

export const formatDateDDMON = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const monthAbbr = getMonthAbbr(d).toLowerCase();
  return `${day}-${monthAbbr}`;
};

const t = (key) => i18n.t(`common:${key}`);

export const getPeriodPresets = () => ({
  two_weeks: {
    key: 'two_weeks',
    label: t('preset_two_weeks'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date(referenceDate);
      today.setHours(0, 0, 0, 0);
      return { start: today, end: addDays(today, 13) };
    }
  },
  four_weeks: {
    key: 'four_weeks',
    label: t('preset_four_weeks'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date(referenceDate);
      today.setHours(0, 0, 0, 0);
      return { start: today, end: addDays(today, 27) };
    }
  },
  week_workdays: {
    key: 'week_workdays',
    label: t('preset_week_workdays'),
    calculate: (referenceDate = new Date()) => {
      const monday = getMonday(referenceDate);
      const friday = addDays(monday, 4);
      return { start: monday, end: friday };
    }
  },
  week_full: {
    key: 'week_full',
    label: t('preset_week_full'),
    calculate: (referenceDate = new Date()) => {
      const monday = getMonday(referenceDate);
      const sunday = addDays(monday, 6);
      return { start: monday, end: sunday };
    }
  },
  month: {
    key: 'month',
    label: t('preset_month'),
    calculate: (referenceDate = new Date()) => {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      return { start, end };
    }
  },
  quarter: {
    key: 'quarter',
    label: t('preset_quarter'),
    calculate: (referenceDate = new Date()) => {
      const quarter = Math.floor(referenceDate.getMonth() / 3);
      const start = new Date(referenceDate.getFullYear(), quarter * 3, 1);
      const end = endOfMonth(addMonths(start, 2));
      return { start, end };
    }
  },
  last_7: {
    key: 'last_7',
    label: t('preset_last_7'),
    calculate: (referenceDate = new Date()) => {
      return {
        start: addDays(referenceDate, -6),
        end: referenceDate
      };
    }
  },
  last_30: {
    key: 'last_30',
    label: t('preset_last_30'),
    calculate: (referenceDate = new Date()) => {
      return {
        start: addDays(referenceDate, -29),
        end: referenceDate
      };
    }
  },
  next_month: {
    key: 'next_month',
    label: t('preset_next_month'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        start: today,
        end: addDays(today, 30)
      };
    }
  },
  next_3_months: {
    key: 'next_3_months',
    label: t('preset_next_3_months'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        start: today,
        end: addMonths(today, 3)
      };
    }
  },
  next_6_months: {
    key: 'next_6_months',
    label: t('preset_next_6_months'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        start: today,
        end: addMonths(today, 6)
      };
    }
  },
  next_year: {
    key: 'next_year',
    label: t('preset_next_year'),
    calculate: (referenceDate = new Date()) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        start: today,
        end: addMonths(today, 12)
      };
    }
  },
  custom: {
    key: 'custom',
    label: t('preset_custom'),
    calculate: null
  }
});

// Backward compatibility - static reference that calls getPeriodPresets()
export const PERIOD_PRESETS = new Proxy({}, {
  get(_, prop) {
    const presets = getPeriodPresets();
    if (prop === Symbol.iterator) return undefined;
    return presets[prop];
  },
  ownKeys() {
    return Object.keys(getPeriodPresets());
  },
  getOwnPropertyDescriptor(_, prop) {
    const presets = getPeriodPresets();
    if (prop in presets) {
      return { configurable: true, enumerable: true, value: presets[prop] };
    }
    return undefined;
  }
});

export const navigatePeriod = (direction, currentStart, currentEnd) => {
  const duration = differenceInDays(currentEnd, currentStart) + 1;

  if (direction === 'prev') {
    return {
      start: addDays(currentStart, -duration),
      end: addDays(currentEnd, -duration)
    };
  } else {
    return {
      start: addDays(currentStart, duration),
      end: addDays(currentEnd, duration)
    };
  }
};

export const savePeriodToStorage = (page, startDate, endDate, preset) => {
  try {
    localStorage.setItem(`${page}_period`, JSON.stringify({
      start: formatDateISO(startDate),
      end: formatDateISO(endDate),
      preset: preset
    }));
  } catch (error) {
    logger.error('Errore nel salvare il periodo:', error);
  }
};

export const loadPeriodFromStorage = (page) => {
  try {
    const saved = localStorage.getItem(`${page}_period`);
    if (saved) {
      const { start, end, preset } = JSON.parse(saved);
      return {
        start: new Date(start),
        end: new Date(end),
        preset: preset
      };
    }
  } catch (error) {
    logger.error('Errore nel caricare il periodo:', error);
  }
  return null;
};
